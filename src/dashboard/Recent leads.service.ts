import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadSource, LeadStatus, LeadPriority, Prisma } from "@prisma/client";
import { RecentLeadsQueryDto } from "./dto/Recent leads query.dto";

@Injectable()
export class RecentLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentLeads(query: RecentLeadsQueryDto) {
    const {
      preset = "30days",
      from,
      to,
      counselorId,
      source,
      status,
      priority,
      search,
      limit = 6,
      offset = 0,
    } = query;

    const { currentFrom, currentTo } = this.resolveDateRange(preset, from, to);

    // Build where clause
    const where: Prisma.LeadWhereInput = {
      createdAt: { gte: currentFrom, lte: currentTo },
      ...(counselorId && { counselorId }),
      ...(source && { source: source as LeadSource }),
      ...(status && { status: status as LeadStatus }),
      ...(priority && { priority: priority as LeadPriority }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Run count + data fetch in parallel
    const [total, leads] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          country: true,
          ieltsScore: true,
          source: true,
          priority: true,
          status: true,
          createdAt: true,
          followUpDate: true,
          counselor: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const data = leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      country: lead.country,
      ieltsScore: lead.ieltsScore,
      source: lead.source,
      priority: lead.priority,
      status: lead.status,
      followUpDate: lead.followUpDate,
      createdAt: lead.createdAt,
      // Initials for avatar (e.g. "Priya Sharma" → "PS")
      initials: lead.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      counselor: lead.counselor
        ? { id: lead.counselor.id, name: lead.counselor.name }
        : null,
    }));

    return {
      period: {
        preset,
        from: currentFrom.toISOString(),
        to: currentTo.toISOString(),
      },
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      data,
    };
  }

  // ─── Date range resolver ──────────────────────────────────────────────────

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
