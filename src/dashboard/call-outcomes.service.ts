import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadSource } from "@prisma/client";

@Injectable()
export class CallOutcomesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCallOutcomes(query: {
    preset?: string;
    from?: string;
    to?: string;
    counselorId?: string;
    source?: string;
  }) {
    const { preset = "30days", from, to, counselorId, source } = query;

    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);

    const baseWhere = {
      createdAt: { gte: currentFrom, lte: currentTo },
      ...(counselorId && { lead: { counselorId } }),
      ...(source && { lead: { source: source as LeadSource } }),
    };

    const [
      interested,
      converted,
      scheduleCallback,
      notInterested,
      noAnswer,
      voicemail,
      totalCalls,
    ] = await Promise.all([
      this.prisma.callLog.count({
        where: { ...baseWhere, outcome: "INTERESTED" },
      }),
      this.prisma.callLog.count({
        where: { ...baseWhere, outcome: "CONVERTED" },
      }),
      this.prisma.callLog.count({
        where: { ...baseWhere, outcome: "SCHEDULE_CALLBACK" },
      }),
      this.prisma.callLog.count({
        where: { ...baseWhere, outcome: "NOT_INTERESTED" },
      }),
      this.prisma.callLog.count({
        where: { ...baseWhere, outcome: "NO_ANSWER" },
      }),
      this.prisma.callLog.count({
        where: { ...baseWhere, outcome: "VOICEMAIL" },
      }),
      this.prisma.callLog.count({ where: baseWhere }),
    ]);

    const positive = interested + converted;
    const positiveRate =
      totalCalls > 0 ? Math.round((positive / totalCalls) * 100) : 0;

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
      },
      totalCalls,
      positiveRate,
      outcomeCounts: {
        INTERESTED: interested,
        CONVERTED: converted,
        SCHEDULE_CALLBACK: scheduleCallback,
        NOT_INTERESTED: notInterested,
        NO_ANSWER: noAnswer,
        VOICEMAIL: voicemail,
      },
    };
  }

  private resolveDateRange(preset: string, from?: string, to?: string) {
    if (preset === "custom") {
      return {
        currentFrom: this.startOfDay(new Date(from!)),
        currentTo: this.endOfDay(new Date(to!)),
      };
    }
    const presetDays: Record<string, number> = {
      today: 0,
      "7days": 6,
      "30days": 29,
      "90days": 89,
    };
    const days = presetDays[preset] ?? 29;
    const currentFrom = this.startOfDay(new Date());
    currentFrom.setDate(currentFrom.getDate() - days);
    return { currentFrom, currentTo: this.endOfDay(new Date()) };
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
