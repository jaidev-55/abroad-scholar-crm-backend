import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadSource } from "@prisma/client";
import { LeadSourcesQueryDto } from "./dto/lead-sources-query.dto";

const SOURCE_COLORS: Record<string, string> = {
  INSTAGRAM: "#E91E8C",
  FACEBOOK: "#3B82F6",
  WEBSITE: "#22C55E",
  REFERRAL: "#F59E0B",
  WALK_IN: "#8B5CF6",
  GOOGLE_ADS: "#EF4444",
  META_ADS: "#06B6D4",
  GOOGLE_SHEET: "#64748B",
};

@Injectable()
export class LeadSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSources(query: LeadSourcesQueryDto) {
    const { preset = "30days", from, to, counselorId, source } = query;

    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);

    const grouped = await this.prisma.lead.groupBy({
      by: ["source"],
      where: {
        createdAt: { gte: currentFrom, lte: currentTo },
        ...(counselorId && { counselorId }),
        ...(source && { source: source as LeadSource }), // ← now applied
      },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    });

    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

    const sources = grouped.map((g) => ({
      source: g.source,
      count: g._count._all,
      percentage: total > 0 ? Math.round((g._count._all / total) * 100) : 0,
      color: SOURCE_COLORS[g.source] ?? "#94A3B8",
    }));

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
      },
      total,
      sources,
    };
  }

  private resolveDateRange(preset: string, from?: string, to?: string) {
    if (preset === "custom") {
      if (!from || !to)
        throw new BadRequestException(
          'from and to are required when preset is "custom"',
        );
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
