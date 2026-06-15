import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface NotificationItem {
  id: string;
  type:
    | "new_lead"
    | "followup"
    | "overdue"
    | "hot"
    | "enrolled_risk"
    | "visa_expiry"
    | "intake_near";
  title: string;
  subtitle: string;
  time: string;
  priority: "high" | "medium" | "low";
  leadId?: string;
  studentId?: string;
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

    // ENROLLED STUDENT NOTIFICATIONS

    // Active risk alerts on enrolled students
    const activeRisks = await this.prisma.enrollmentRisk.findMany({
      where: {
        isResolved: false,
        student: counselorFilter,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
            counselorId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    activeRisks.forEach((risk) => {
      const priorityMap: Record<string, "high" | "medium" | "low"> = {
        VISA_REJECTED: "high",
        INTAKE_APPROACHING: "high",
        FEE_OVERDUE: "medium",
        CAS_PENDING: "medium",
      };

      notifications.push({
        id: `risk-${risk.id}`,
        type: "enrolled_risk",
        title: `${risk.student.fullName} (${risk.student.studentId})`,
        subtitle: risk.message,
        time: risk.createdAt.toISOString(),
        priority: priorityMap[risk.type] ?? "medium",
        studentId: risk.student.id,
        read: false,
      });
    });

    //  Intake approaching within 30 days (even without a risk record)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const nearIntake = await this.prisma.enrolledStudent.findMany({
      where: {
        ...counselorFilter,
        intakeDate: { gte: today, lte: thirtyDaysFromNow },
        stage: { not: "TRAVEL_DONE" },
      },
      select: {
        id: true,
        fullName: true,
        studentId: true,
        intakeDate: true,
        stage: true,
      },
      orderBy: { intakeDate: "asc" },
      take: 20,
    });

    nearIntake.forEach((student) => {
      const daysLeft = Math.ceil(
        (student.intakeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      // Avoid duplicate if risk already covers this
      const alreadyHasRisk = activeRisks.some(
        (r) => r.student.id === student.id && r.type === "INTAKE_APPROACHING",
      );
      if (!alreadyHasRisk) {
        notifications.push({
          id: `intake-${student.id}`,
          type: "intake_near",
          title: `Intake soon: ${student.fullName}`,
          subtitle: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to intake — currently at ${student.stage.replace(/_/g, " ").toLowerCase()}`,
          time: student.intakeDate.toISOString(),
          priority: daysLeft <= 7 ? "high" : "medium",
          studentId: student.id,
          read: false,
        });
      }
    });

    // 7. Visa not started but stage is advanced
    const visaNotStarted = await this.prisma.enrolledStudent.findMany({
      where: {
        ...counselorFilter,
        visaStatus: "NOT_STARTED",
        stage: { in: ["CAS_I20_ISSUED", "VISA_FILED", "VISA_APPROVED"] },
      },
      select: {
        id: true,
        fullName: true,
        studentId: true,
        stage: true,
        updatedAt: true,
      },
      take: 10,
    });

    visaNotStarted.forEach((student) => {
      notifications.push({
        id: `visa-notstarted-${student.id}`,
        type: "visa_expiry",
        title: `Visa not started: ${student.fullName}`,
        subtitle: `Stage is ${student.stage.replace(/_/g, " ").toLowerCase()} but visa processing hasn't begun`,
        time: student.updatedAt.toISOString(),
        priority: "high",
        studentId: student.id,
        read: false,
      });
    });
    // Sort: high priority first, then by time (newest first)
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
      const pd = order[a.priority] - order[b.priority];
      return pd || new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return notifications.slice(0, 50);
  }
}
