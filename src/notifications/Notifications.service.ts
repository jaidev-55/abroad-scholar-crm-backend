import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface NotificationItem {
  id: string;
  type: "new_lead" | "followup" | "overdue" | "hot";
  title: string;
  subtitle: string;
  time: string;
  priority: "high" | "medium" | "low";
  leadId: string;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(user: any): Promise<NotificationItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfToday = today;

    // ── Build where clause based on role ─────────────────────────────────────
    const counselorFilter =
      user.role === "COUNSELOR" ? { counselorId: user.id } : {};

    const notifications: NotificationItem[] = [];

    // 1. Overdue follow-ups (followUpDate < today, not LOST/CONVERTED)
    const overdueLeads = await this.prisma.lead.findMany({
      where: {
        ...counselorFilter,
        followUpDate: { lt: today },
        status: { notIn: ["LOST", "CONVERTED"] },
      },
      select: {
        id: true,
        fullName: true,
        followUpDate: true,
        priority: true,
      },
      orderBy: { followUpDate: "asc" },
      take: 20,
    });

    overdueLeads.forEach((lead) => {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(lead.followUpDate!).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      notifications.push({
        id: `overdue-${lead.id}`,
        type: "overdue",
        title: `Overdue: ${lead.fullName}`,
        subtitle: `Follow-up was due ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} ago`,
        time: lead.followUpDate!.toISOString(),
        priority: "high",
        leadId: lead.id,
        read: false,
      });
    });

    // 2. Follow-ups due today
    const followUpToday = await this.prisma.lead.findMany({
      where: {
        ...counselorFilter,
        followUpDate: { gte: today, lt: tomorrow },
        status: { notIn: ["LOST", "CONVERTED"] },
      },
      select: {
        id: true,
        fullName: true,
        followUpDate: true,
        priority: true,
      },
      orderBy: { priority: "desc" },
      take: 20,
    });

    followUpToday.forEach((lead) => {
      notifications.push({
        id: `followup-${lead.id}`,
        type: "followup",
        title: `Follow-up today: ${lead.fullName}`,
        subtitle: "Scheduled for today — don't miss it!",
        time: lead.followUpDate!.toISOString(),
        priority: "medium",
        leadId: lead.id,
        read: false,
      });
    });

    // 3. New leads created today
    const newLeads = await this.prisma.lead.findMany({
      where: {
        ...counselorFilter,
        createdAt: { gte: startOfToday, lt: tomorrow },
      },
      select: {
        id: true,
        fullName: true,
        source: true,
        country: true,
        createdAt: true,
        priority: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    newLeads.forEach((lead) => {
      notifications.push({
        id: `new-${lead.id}`,
        type: "new_lead",
        title: `New lead: ${lead.fullName}`,
        subtitle: `From ${lead.source?.replace(/_/g, " ")} — ${lead.country ?? ""}`,
        time: lead.createdAt.toISOString(),
        priority: "low",
        leadId: lead.id,
        read: false,
      });
    });

    // 4. Hot leads without follow-up set (not new today, not overdue)
    const hotLeads = await this.prisma.lead.findMany({
      where: {
        ...counselorFilter,
        priority: "HOT",
        status: { notIn: ["LOST", "CONVERTED"] },
        followUpDate: null,
        createdAt: { lt: startOfToday },
      },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        country: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    hotLeads.forEach((lead) => {
      notifications.push({
        id: `hot-${lead.id}`,
        type: "hot",
        title: `Hot lead: ${lead.fullName}`,
        subtitle: "No follow-up set — needs immediate attention",
        time: lead.createdAt.toISOString(),
        priority: "high",
        leadId: lead.id,
        read: false,
      });
    });

    // ── Sort: high priority first, then by time (newest first) ───────────────
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
      const pd = order[a.priority] - order[b.priority];
      return pd || new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return notifications.slice(0, 50);
  }
}
