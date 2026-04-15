import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadStatus, LeadPriority, LeadSource, Prisma } from "@prisma/client";
import {
  DashboardStatsQueryDto,
  DatePreset,
} from "./dto/dashboard-stats-query.dto";
import { LeadsTrendQueryDto } from "./dto/Leads trend query.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: DashboardStatsQueryDto) {
    const { preset = "today", from, to, counselorId, source } = query;

    //  Resolve current date range from preset or custom
    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);

    // Previous period: same duration shifted back
    const periodMs = currentTo.getTime() - currentFrom.getTime();
    const prevFrom = new Date(currentFrom.getTime() - periodMs);
    const prevTo = new Date(currentTo.getTime() - periodMs);

    // Base where clause builders
    const baseWhere = (
      rangeFrom: Date,
      rangeTo: Date,
    ): Prisma.LeadWhereInput => ({
      createdAt: { gte: rangeFrom, lte: rangeTo },
      ...(counselorId && { counselorId }),
      ...(source && { source: source as LeadSource }),
    });

    // Follow-ups use a separate date field, not createdAt
    const followUpWhere = (dueBefore: Date): Prisma.LeadWhereInput => ({
      ...(counselorId && { counselorId }),
      ...(source && { source: source as LeadSource }),
      followUpDate: { lte: dueBefore },
      status: { notIn: [LeadStatus.CONVERTED, LeadStatus.LOST] },
    });

    //  Run all counts in parallel
    const [
      totalLeads,
      prevTotalLeads,
      hotLeads,
      prevHotLeads,
      followUpsDue,
      prevFollowUpsDue,
      converted,
      prevConverted,
      lostLeads,
      prevLostLeads,
    ] = await Promise.all([
      this.prisma.lead.count({ where: baseWhere(currentFrom, currentTo) }),
      this.prisma.lead.count({ where: baseWhere(prevFrom, prevTo) }),

      this.prisma.lead.count({
        where: {
          ...baseWhere(currentFrom, currentTo),
          priority: LeadPriority.HOT,
        },
      }),
      this.prisma.lead.count({
        where: { ...baseWhere(prevFrom, prevTo), priority: LeadPriority.HOT },
      }),

      this.prisma.lead.count({
        where: followUpWhere(this.endOfDay(new Date())),
      }),
      this.prisma.lead.count({ where: followUpWhere(prevTo) }),

      this.prisma.lead.count({
        where: {
          ...baseWhere(currentFrom, currentTo),
          status: LeadStatus.CONVERTED,
        },
      }),
      this.prisma.lead.count({
        where: { ...baseWhere(prevFrom, prevTo), status: LeadStatus.CONVERTED },
      }),

      this.prisma.lead.count({
        where: {
          ...baseWhere(currentFrom, currentTo),
          status: LeadStatus.LOST,
        },
      }),
      this.prisma.lead.count({
        where: { ...baseWhere(prevFrom, prevTo), status: LeadStatus.LOST },
      }),
    ]);

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
      },
      stats: {
        totalLeads: {
          value: totalLeads,
          change: this.pctChange(totalLeads, prevTotalLeads),
        },
        hotLeads: {
          value: hotLeads,
          change: this.pctChange(hotLeads, prevHotLeads),
        },
        followUpsDue: {
          value: followUpsDue,
          change: this.pctChange(followUpsDue, prevFollowUpsDue),
        },
        converted: {
          value: converted,
          change: this.pctChange(converted, prevConverted),
        },
        lostLeads: {
          value: lostLeads,
          change: this.pctChange(lostLeads, prevLostLeads),
        },
      },
    };
  }

  //  Date range resolver

  private resolveDateRange(
    preset: DatePreset,
    from?: string,
    to?: string,
  ): { currentFrom: Date; currentTo: Date } {
    const now = new Date();

    if (preset === "custom") {
      if (!from || !to) {
        throw new BadRequestException(
          'from and to are required when preset is "custom"',
        );
      }
      return {
        currentFrom: this.startOfDay(new Date(from)),
        currentTo: this.endOfDay(new Date(to)),
      };
    }

    const presetDays: Record<Exclude<DatePreset, "custom">, number> = {
      today: 0,
      "7days": 6,
      "30days": 29,
      "90days": 89,
    };

    const days = presetDays[preset as Exclude<DatePreset, "custom">] ?? 0;
    const currentFrom = this.startOfDay(new Date());
    currentFrom.setDate(currentFrom.getDate() - days);

    return {
      currentFrom,
      currentTo: this.endOfDay(now),
    };
  }

  //  Helpers

  private pctChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
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

export class LeadsTrendService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrend(query: LeadsTrendQueryDto) {
    const {
      preset = "7days",
      from,
      to,
      groupBy = "day",
      counselorId,
      source,
    } = query;

    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);

    // Base filter (no date — we'll group by date in memory)
    const baseWhere: Prisma.LeadWhereInput = {
      createdAt: { gte: currentFrom, lte: currentTo },
      ...(counselorId && { counselorId }),
      ...(source && { source: source as LeadSource }),
    };

    // Fetch all leads in range with only the fields we need
    const leads = await this.prisma.lead.findMany({
      where: baseWhere,
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Build a map of date-label → { newLeads, converted }
    const buckets = this.buildBuckets(currentFrom, currentTo, groupBy);

    for (const lead of leads) {
      const label = this.getLabel(lead.createdAt, groupBy);
      if (buckets[label]) {
        buckets[label].newLeads += 1;
        if (lead.status === LeadStatus.CONVERTED) {
          buckets[label].converted += 1;
        }
      }
    }

    const data = Object.entries(buckets).map(([date, counts]) => ({
      date,
      newLeads: counts.newLeads,
      converted: counts.converted,
    }));

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
        groupBy,
      },
      data,
    };
  }

  // ─── Build empty buckets for every day/week in range ─────────────────────────

  private buildBuckets(
    from: Date,
    to: Date,
    groupBy: "day" | "week",
  ): Record<string, { newLeads: number; converted: number }> {
    const buckets: Record<string, { newLeads: number; converted: number }> = {};
    const cursor = new Date(from);

    while (cursor <= to) {
      const label = this.getLabel(cursor, groupBy);
      if (!buckets[label]) {
        buckets[label] = { newLeads: 0, converted: 0 };
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return buckets;
  }

  // ─── Format date into bucket label ───────────────────────────────────────────

  private getLabel(date: Date, groupBy: "day" | "week"): string {
    if (groupBy === "week") {
      // ISO week start (Monday)
      const d = new Date(date);
      const day = d.getDay(); // 0=Sun
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().slice(0, 10); // "2026-04-07"
    }
    return date.toISOString().slice(0, 10); // "2026-04-13"
  }

  // ─── Date range resolver (same pattern as stats) ──────────────────────────────

  private resolveDateRange(
    preset: string,
    from?: string,
    to?: string,
  ): { currentFrom: Date; currentTo: Date } {
    if (preset === "custom") {
      if (!from || !to) {
        throw new BadRequestException(
          'from and to are required when preset is "custom"',
        );
      }
      return {
        currentFrom: this.startOfDay(new Date(from)),
        currentTo: this.endOfDay(new Date(to)),
      };
    }

    const presetDays: Record<string, number> = {
      today: 0,
      "7days": 6,
      "30days": 29,
      "90days": 89,
    };

    const days = presetDays[preset] ?? 6;
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
