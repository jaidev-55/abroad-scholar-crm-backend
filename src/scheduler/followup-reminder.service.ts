import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class FollowUpReminderService {
  private readonly logger = new Logger(FollowUpReminderService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ── Runs every day at 8:00 AM
  @Cron("0 8 * * *", { timeZone: "Asia/Kolkata" })
  async sendDailyFollowUpReminders() {
    this.logger.log("⏰ Running daily follow-up reminder job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all leads with follow-up due TODAY
    const leadsFollowUpToday = await this.prisma.lead.findMany({
      where: {
        followUpDate: { gte: today, lt: tomorrow },
        status: { notIn: ["CONVERTED", "LOST"] },
        counselorId: { not: null },
      },
      include: {
        counselor: true,
      },
    });

    this.logger.log(
      `Found ${leadsFollowUpToday.length} leads with follow-up due today`,
    );

    if (leadsFollowUpToday.length === 0) return;

    // Group leads by counselor
    const byCounselor = new Map<
      string,
      { counselor: any; leads: typeof leadsFollowUpToday }
    >();

    for (const lead of leadsFollowUpToday) {
      if (!lead.counselor?.email) continue;
      const key = lead.counselor.id;
      if (!byCounselor.has(key)) {
        byCounselor.set(key, { counselor: lead.counselor, leads: [] });
      }
      byCounselor.get(key)!.leads.push(lead);
    }

    // Send one digest email per counselor
    for (const { counselor, leads } of byCounselor.values()) {
      try {
        await this.emailService.sendFollowUpReminderDigest(counselor, leads);
        this.logger.log(
          `✅ Sent follow-up digest to ${counselor.name} (${leads.length} leads)`,
        );
      } catch (err) {
        const e = err as Error;
        this.logger.error(
          `❌ Failed to send to ${counselor.email}: ${e.message}`,
        );
      }
    }
  }

  // ── Runs every day at 9:00 AM — overdue reminder ──────────────────────────
  @Cron("0 9 * * *", { timeZone: "Asia/Kolkata" })
  async sendOverdueReminders() {
    this.logger.log("⚠️ Running overdue follow-up reminder job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Leads overdue (followUpDate < today) and still active
    const overdueLeads = await this.prisma.lead.findMany({
      where: {
        followUpDate: { lt: today },
        status: { notIn: ["CONVERTED", "LOST"] },
        counselorId: { not: null },
      },
      include: { counselor: true },
    });

    this.logger.log(`Found ${overdueLeads.length} overdue leads`);

    if (overdueLeads.length === 0) return;

    const byCounselor = new Map<
      string,
      { counselor: any; leads: typeof overdueLeads }
    >();

    for (const lead of overdueLeads) {
      if (!lead.counselor?.email) continue;
      const key = lead.counselor.id;
      if (!byCounselor.has(key)) {
        byCounselor.set(key, { counselor: lead.counselor, leads: [] });
      }
      byCounselor.get(key)!.leads.push(lead);
    }

    for (const { counselor, leads } of byCounselor.values()) {
      try {
        await this.emailService.sendOverdueReminderDigest(counselor, leads);
        this.logger.log(
          `✅ Sent overdue digest to ${counselor.name} (${leads.length} overdue)`,
        );
      } catch (err) {
        const e = err as Error;
        this.logger.error(
          `❌ Failed to send to ${counselor.email}: ${e.message}`,
        );
      }
    }
  }
}
