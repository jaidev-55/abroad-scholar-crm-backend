import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadSource, LeadStatus } from "@prisma/client";
import { TopCounselorsQueryDto } from "./dto/top-counselors-query.dto";

@Injectable()
export class TopCounselorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopCounselors(query: TopCounselorsQueryDto) {
    const { preset = "30days", from, to, source, limit = 5 } = query;
    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);
    const baseWhere = {
      createdAt: { gte: currentFrom, lte: currentTo },
      counselorId: { not: null },
      ...(source && { source: source as LeadSource }),
    };
    // Step 1: get all leads in range with counselor info
    const leads = await this.prisma.lead.findMany({
      where: baseWhere,
      select: {
        status: true,
        counselorId: true,
        counselor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Step 2: aggregate per counselor in memory
    const counselorMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        totalLeads: number;
        converted: number;
      }
    >();
    for (const lead of leads) {
      if (!lead.counselorId || !lead.counselor) continue;

      const existing = counselorMap.get(lead.counselorId);
      if (existing) {
        existing.totalLeads += 1;
        if (lead.status === LeadStatus.CONVERTED) existing.converted += 1;
      } else {
        counselorMap.set(lead.counselorId, {
          id: lead.counselor.id,
          name: lead.counselor.name,
          email: lead.counselor.email,
          totalLeads: 1,
          converted: lead.status === LeadStatus.CONVERTED ? 1 : 0,
        });
      }
    }

    // Step 3: sort by conversion rate desc, then totalLeads desc
    const counselors = Array.from(counselorMap.values())
      .map((c) => ({
        ...c,
        conversionRate:
          c.totalLeads > 0 ? Math.round((c.converted / c.totalLeads) * 100) : 0,
        // Initials for avatar (e.g. "Ganesh Kumar" → "GK")
        initials: c.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }))
      .sort((a, b) =>
        b.conversionRate !== a.conversionRate
          ? b.conversionRate - a.conversionRate
          : b.totalLeads - a.totalLeads,
      )
      .slice(0, limit);

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
      },
      counselors,
    };
  }
  // Date range resolver

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
