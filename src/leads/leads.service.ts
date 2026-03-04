import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { CreateCallLogDto } from "./dto/create-call-log.dto";
import { ActivityType } from "@prisma/client";

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}
  // Create a new lead
  async create(dto: CreateLeadDto) {
    // Prevent duplicate leads by phone number
    const existing = await this.prisma.lead.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException("Lead with this phone already exists");
    }

    // Prevent creating a lead directly with LOST status
    if (dto.status === "LOST") {
      throw new BadRequestException("Lead cannot be created directly as LOST");
    }

    // Validate assigned counselor
    if (dto.counselorId) {
      const counselor = await this.prisma.user.findUnique({
        where: { id: dto.counselorId },
      });

      if (!counselor) {
        throw new BadRequestException("Invalid counselor ID");
      }
    }
    // Create lead
    const newLead = await this.prisma.lead.create({
      data: {
        ...dto,
        status: dto.status ?? "NEW",
        counselorId: dto.counselorId ?? null,
      },
    });

    // Log activity for lead creation
    await this.prisma.leadActivity.create({
      data: {
        type: "EDIT",
        message: "Lead created",
        leadId: newLead.id,
      },
    });

    return newLead;
  }

  // Fetch leads with filters and optional pagination
  async findAll(filters: any) {
    const {
      search,
      stage,
      source,
      counselorId,
      country,
      priority,
      status,
      lostReason,
      followUpFrom,
      followUpTo,
      startDate,
      endDate,
      page,
      limit,
    } = filters;

    const where: any = {};

    // Search by name, phone or email
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    //  Exact match filters
    if (stage) where.stage = stage;
    if (source) where.source = source;
    if (counselorId) where.counselorId = counselorId;
    if (country) where.country = country;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (lostReason) where.lostReason = lostReason;

    //  Date range filter
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    // Filter by follow-up date range
    if (followUpFrom && followUpTo) {
      where.followUpDate = {
        gte: new Date(followUpFrom),
        lte: new Date(followUpTo),
      };
    }

    // If pagination not provided -> return all (Pipeline view)
    if (!page || !limit) {
      return this.prisma.lead.findMany({
        where,
        include: {
          counselor: true,
          notes: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Pagination mode (All Leads table)
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          counselor: true,
          notes: {
            orderBy: { createdAt: "desc" },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  // Get single lead with counselor and notes
  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        counselor: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    return lead;
  }

  // Update lead details
  async updateLead(id: string, dto: UpdateLeadDto) {
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      throw new NotFoundException("Lead not found");
    }

    // Ensure phone number is unique
    if (dto.phone && dto.phone !== existingLead.phone) {
      const phoneExists = await this.prisma.lead.findUnique({
        where: { phone: dto.phone },
      });

      if (phoneExists) {
        throw new BadRequestException("Lead with this phone already exists");
      }
    }

    // Validate counselor assignment
    if (dto.counselorId) {
      const counselor = await this.prisma.user.findUnique({
        where: { id: dto.counselorId },
      });

      if (!counselor) {
        throw new BadRequestException("Invalid counselor ID");
      }
    }

    // LOST status requires a reason
    if (
      dto.status === "LOST" &&
      (!dto.lostReason || dto.lostReason.trim() === "")
    ) {
      throw new BadRequestException(
        "Lost reason is required when marking lead as LOST",
      );
    }

    // Update lead
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        counselorId: dto.counselorId ?? null,
      },
    });

    //  Log status change
    if (dto.status && dto.status !== existingLead.status) {
      await this.prisma.leadActivity.create({
        data: {
          type: "STATUS_CHANGE",
          message: `Status changed from ${existingLead.status} to ${dto.status}`,
          leadId: id,
        },
      });
    }

    // Log edit activity
    await this.prisma.leadActivity.create({
      data: {
        type: "EDIT",
        message: "Lead details updated",
        leadId: id,
      },
    });

    return updatedLead;
  }

  // Dashboard statistics
  async getStats() {
    const now = new Date();

    // Start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const total = await this.prisma.lead.count();

    const newToday = await this.prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    const followUpsDue = await this.prisma.lead.count({
      where: {
        followUpDate: {
          lte: now,
        },
        status: {
          notIn: ["CONVERTED", "LOST"],
        },
      },
    });

    const converted = await this.prisma.lead.count({
      where: {
        status: "CONVERTED",
      },
    });

    const lost = await this.prisma.lead.count({
      where: {
        status: "LOST",
      },
    });

    return {
      total,
      newToday,
      followUpsDue,
      converted,
      lost,
    };
  }

  // Fetch activity timeline of a lead
  async getActivity(leadId: string, type?: ActivityType, search?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    const where: any = { leadId };

    // Filter by activity type
    if (type) {
      where.type = type;
    }

    // Search in activity messages
    if (search) {
      where.OR = [{ message: { contains: search, mode: "insensitive" } }];
    }

    return this.prisma.leadActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  // Log a call activity for a lead
  async logCall(leadId: string, dto: CreateCallLogDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    return this.prisma.leadActivity.create({
      data: {
        type: "CALL",
        message: `call logged - ${dto.outcome}`,
        leadId,
        meta: {
          outcome: dto.outcome,
          notes: dto.notes ?? null,
          duration: dto.duration ?? null,
          rating: dto.rating ?? null,
        },
      },
    });
  }

  // Mark a lead as LOST
  async markAsLost(id: string, dto: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    if (lead.status === "LOST") {
      throw new BadRequestException("Lead is already marked as LOST");
    }

    // Update lead status
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: "LOST",
        lostReason: dto.lostReason,
      },
    });

    // Log lost activity
    await this.prisma.leadActivity.create({
      data: {
        type: "STATUS_CHANGE",
        message: `Lead marked as LOST. Reason: ${dto.lostReason}`,
        leadId: id,
      },
    });

    // Save optional note
    if (dto.additionalNotes) {
      await this.prisma.leadNote.create({
        data: {
          content: dto.additionalNotes,
          leadId: id,
        },
      });

      await this.prisma.leadActivity.create({
        data: {
          type: "NOTE",
          message: "Lost reason note added",
          leadId: id,
        },
      });
    }

    return updatedLead;
  }

  // Add note to a lead
  async addNote(leadId: string, dto: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    const note = await this.prisma.leadNote.create({
      data: {
        content: dto.content,
        leadId,
      },
    });

    // Log note activity
    await this.prisma.leadActivity.create({
      data: {
        type: "NOTE",
        message: "Note added",
        leadId,
      },
    });

    return note;
  }
}
