import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IeltsQueryDto } from "./dto/ielts-query.dto";
import { UserRole } from "@prisma/client";
import { CreateIeltsDto } from "./dto/create-ielts.dto";
import { UpdateScoresDto } from "./dto/update-ielts.dto";

@Injectable()
export class IeltsService {
  constructor(private prisma: PrismaService) {}

  async getAll(query: IeltsQueryDto, userId: string, userRole: string) {
    const {
      search,
      status,
      examType,
      counselorId,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(search && {
        OR: [
          { studentName: { contains: search, mode: "insensitive" } },
          { targetUniversity: { contains: search, mode: "insensitive" } },
        ],
      }),

      ...(status && { status }),
      ...(examType && { examType }),
      ...(userRole === UserRole.COUNSELOR
        ? { counselorId: userId }
        : counselorId && { counselorId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.ieltsTracking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          counselor: { select: { id: true, name: true } },
          scoreHistory: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      this.prisma.ieltsTracking.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats(userId: string, userRole: string) {
    const basewhere: any =
      userRole === UserRole.COUNSELOR ? { counselorId: userId } : {};

    const [
      total,
      preparing,
      scheduled,
      completed,
      notStarted,
      upcomingExams,
      records,
    ] = await Promise.all([
      this.prisma.ieltsTracking.count({ where: basewhere }),
      this.prisma.ieltsTracking.count({
        where: { ...basewhere, status: "PREPARING" },
      }),

      this.prisma.ieltsTracking.count({
        where: { ...basewhere, status: "SCHEDULED" },
      }),
      this.prisma.ieltsTracking.count({
        where: { ...basewhere, status: "COMPLETED" },
      }),
      this.prisma.ieltsTracking.count({
        where: { ...basewhere, status: "NOT_STARTED" },
      }),

      this.prisma.ieltsTracking.count({
        where: {
          ...basewhere,
          examDate: { gte: new Date() },
          status: { in: ["PREPARING", "SCHEDULED"] },
        },
      }),
      this.prisma.ieltsTracking.findMany({
        where: { ...basewhere, currentOA: { not: null } },
        select: { currentOA: true, requiredScore: true },
      }),
    ]);
    const avgScore = records.length
      ? Math.round(
          (records.reduce((s, r) => s + (r.currentOA ?? 0), 0) /
            records.length) *
            10,
        ) / 10
      : 0;

    const targetMet = records.filter(
      (r) =>
        r.currentOA !== null &&
        r.requiredScore !== null &&
        r.currentOA! >= r.requiredScore!,
    ).length;

    return {
      total,
      preparing,
      scheduled,
      completed,
      notStarted,
      upcomingExams,
      avgScore,
      targetMet,
    };
  }

  async getOne(id: string) {
    const record = await this.prisma.ieltsTracking.findUnique({
      where: { id },
      include: {
        counselor: { select: { id: true, name: true } },
        scoreHistory: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!record) throw new NotFoundException("IELTS record not found");
    return record;
  }

  async create(dto: CreateIeltsDto) {
    return this.prisma.ieltsTracking.create({ data: dto });
  }
  async update(id: string, dto: Partial<CreateIeltsDto>) {
    await this.getOne(id);
    return this.prisma.ieltsTracking.update({ where: { id }, data: dto });
  }

  async updateScores(id: string, dto: UpdateScoresDto) {
    await this.getOne(id);
    const overall =
      dto.listening && dto.reading && dto.writing && dto.speaking
        ? Math.round(
            ((dto.listening + dto.reading + dto.writing + dto.speaking) / 4) *
              2,
          ) / 2
        : undefined;

    return this.prisma.$transaction([
      this.prisma.ieltsTracking.update({
        where: { id },
        data: {
          currentL: dto.listening,
          currentR: dto.reading,
          currentW: dto.writing,
          currentS: dto.speaking,
          currentOA: overall,
          attempts: { increment: 1 },
        },
      }),
      this.prisma.ieltsScoreHistory.create({
        data: {
          trackingId: id,
          listening: dto.listening,
          reading: dto.reading,
          writing: dto.writing,
          speaking: dto.speaking,
          overall,
          testType: dto.testType,
          notes: dto.notes,
        },
      }),
    ]);
  }

  async delete(id: string) {
    await this.getOne(id);
    return this.prisma.ieltsTracking.delete({ where: { id } });
  }
}
