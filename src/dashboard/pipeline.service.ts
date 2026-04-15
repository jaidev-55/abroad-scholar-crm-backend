import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadSource, LeadStatus } from "@prisma/client";
import { PipelineQueryDto } from "./dto/Pipeline query.dto";

// Colour + order map matches your dashboard funnel bars exactly
const STATUS_META: Record<
  LeadStatus,
  { label: string; color: string; order: number }
> = {
  NEW: { label: "New", color: "#3B82F6", order: 1 }, // blue
  IN_PROGRESS: { label: "In Progress", color: "#8B5CF6", order: 2 }, // purple
  CONVERTED: { label: "Converted", color: "#22C55E", order: 3 }, // green
  LOST: { label: "Lost", color: "#94A3B8", order: 4 }, // gray
};

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getPipeline(query: PipelineQueryDto) {
    const { preset = "30days", from, to, counselorId, source } = query;

    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);

    // Group leads by status
    const grouped = await this.prisma.lead.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: currentFrom, lte: currentTo },
        ...(counselorId && { counselorId }),
        ...(source && { source: source as LeadSource }),
      },
      _count: { _all: true },
    });

    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

    // Ensure all 4 statuses always appear even if count is 0
    const stages = (Object.keys(STATUS_META) as LeadStatus[])
      .sort((a, b) => STATUS_META[a].order - STATUS_META[b].order)
      .map((status) => {
        const found = grouped.find((g) => g.status === status);
        const count = found ? found._count._all : 0;
        return {
          status,
          label: STATUS_META[status].label,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          color: STATUS_META[status].color,
        };
      });

    // Conversion rate: converted / (total - lost)
    const convertedCount =
      stages.find((s) => s.status === "CONVERTED")?.count ?? 0;
    const lostCount = stages.find((s) => s.status === "LOST")?.count ?? 0;
    const eligibleTotal = total - lostCount;
    const conversionRate =
      eligibleTotal > 0
        ? Math.round((convertedCount / eligibleTotal) * 100)
        : 0;

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
      },
      total,
      conversionRate,
      stages,
    };
  }

  // ─── Date range resolver

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
