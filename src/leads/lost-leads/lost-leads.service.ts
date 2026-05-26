import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { LostLeadsQueryDto } from "./dto/lost-leads-query.dto";
import { ActivityType, LeadStatus, UserRole } from "@prisma/client";
import { ReactivateLeadDto } from "./dto/reactivate-lead.dto";

@Injectable()
export class LostLeadService {
  constructor(private prisma: PrismaService) {}

  async getLostLeads(
    query: LostLeadsQueryDto,
    userId: string,
    userRole: string,
  ) {
    const {
      search,
      lostReason,
      counselorId,
      country,
      priority,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: LeadStatus.LOST,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(lostReason && { lostReason }),
      ...(country && { country: { contains: country, mode: "insensitive" } }),
      ...(priority && { priority }),
      ...(userRole === UserRole.COUNSELOR
        ? { counselorId: userId }
        : counselorId && { counselorId }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          counselor: { select: { id: true, name: true, email: true } },
          _count: { select: { callLogs: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLostLeadsStatus(userId: string, userRole: string) {
    const baseWhere: any = {
      status: LeadStatus.LOST,
      ...(userRole === UserRole.COUNSELOR && { counselorId: userId }),
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalLost, lostThisMonth, lostLastMonth, reactivated, lostByReason] =
      await Promise.all([
        this.prisma.lead.count({ where: baseWhere }),

        this.prisma.lead.count({
          where: { ...baseWhere, updatedAt: { gte: startOfMonth } },
        }),

        this.prisma.lead.count({
          where: {
            ...baseWhere,
            updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
        }),

        this.prisma.lead.count({
          where: {
            reactivatedCount: { gt: 0 },
            ...(userRole === UserRole.COUNSELOR && { counselorId: userId }),
          },
        }),

        this.prisma.lead.groupBy({
          by: ["lostReason"],
          where: baseWhere,
          _count: { lostReason: true },
          orderBy: { _count: { lostReason: "desc" } },
        }),
      ]);

    const totalEverLost = totalLost + reactivated;
    const recoveryRate =
      totalEverLost > 0 ? Math.round((reactivated / totalEverLost) * 100) : 0;

    return {
      totalLost,
      lostThisMonth,
      lostLastMonth,
      reactivated,
      recoveryRate,
      topLostReasons: lostByReason.map((r) => ({
        reason: r.lostReason,
        count: r._count.lostReason,
      })),
    };
  }

  async reactivateLead(
    leadId: string,
    dto: ReactivateLeadDto,
    userId: string,
    userRole: string,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { counselor: true },
    });

    if (!lead) throw new NotFoundException("Lead not found");
    if (lead.status !== LeadStatus.LOST)
      throw new ForbiddenException("Lead is not in LOST status");
    if (userRole === UserRole.COUNSELOR && lead.counselorId !== userId)
      throw new ForbiddenException("You can only reactivate your own leads");

    const [updatedLead] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.IN_PROGRESS,
          lostReason: null,
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          reactivatedCount: { increment: 1 },
        },
      }),
      this.prisma.leadActivity.create({
        data: {
          type: ActivityType.STATUS_CHANGE,
          message: `Reactivated from LOST — Reason: ${dto.reason}${dto.notes ? `. Notes: ${dto.notes}` : ""}`,
          leadId,
          userId,
          meta: {
            previousStatus: LeadStatus.LOST,
            reason: dto.reason,
            notes: dto.notes,
          },
        },
      }),
      ...(dto.notes
        ? [
            this.prisma.leadNote.create({
              data: { content: dto.notes, leadId, userId },
            }),
          ]
        : []),
    ]);

    return updatedLead;
  }
}
