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
import * as nodemailer from "nodemailer";
import * as path from "path";
import { LostReason } from "@prisma/client";
import { EmailService } from "../email/email.service";

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}
  // Create a new lead
  async create(dto: CreateLeadDto, user: any) {
    // 1. Prevent duplicate
    const existing = await this.prisma.lead.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException("Lead with this phone already exists");
    }

    let assignedCounselorId: string;

    // 2. Assign counselor
    if (user.role === "COUNSELOR") {
      assignedCounselorId = dto.counselorId ?? user.id;
    } else {
      const counselors = await this.prisma.user.findMany({
        where: { role: "COUNSELOR" },
        orderBy: { createdAt: "asc" },
      });

      if (counselors.length === 0) {
        throw new BadRequestException("No counselors available");
      }

      const lastLead = await this.prisma.lead.findFirst({
        where: { counselorId: { not: null } },
        orderBy: { createdAt: "desc" },
      });

      let nextCounselorId: string;

      if (!lastLead) {
        nextCounselorId = counselors[0].id;
      } else {
        const lastIndex = counselors.findIndex(
          (c) => c.id === lastLead.counselorId,
        );

        const nextIndex =
          lastIndex === -1 ? 0 : (lastIndex + 1) % counselors.length;

        nextCounselorId = counselors[nextIndex].id;
      }

      assignedCounselorId = dto.counselorId ?? nextCounselorId;
    }

    // 3. Validate counselor
    const counselorExists = await this.prisma.user.findUnique({
      where: { id: assignedCounselorId },
    });

    if (!counselorExists) {
      throw new BadRequestException("Invalid counselor ID");
    }

    // 4. Create lead
    const newLead = await this.prisma.lead.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        country: dto.country,
        source: dto.source,
        priority: dto.priority,
        ieltsScore: dto.ieltsScore,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        counselorId: assignedCounselorId,
        status: dto.status ?? "NEW",
      },
    });

    // 5. SAVE NOTES
    if (dto.notes && dto.notes.length > 0) {
      await this.prisma.leadNote.createMany({
        data: dto.notes.map((note) => ({
          content: note,
          leadId: newLead.id,
        })),
      });

      // Optional: log activity
      await this.prisma.leadActivity.create({
        data: {
          type: "NOTE",
          message: `${dto.notes.length} note(s) added during lead creation`,
          leadId: newLead.id,
          userId: user.id,
        },
      });
    }

    // 5. Activity log (KEEP awaited)
    await this.prisma.leadActivity.create({
      data: {
        type: "EDIT",
        message: "Lead created and assigned to counselor",
        leadId: newLead.id,
        userId: user.id,
      },
    });

    // 6. Prepare email data
    const counselor = counselorExists!; // ✅ safe (already checked)

    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    // 7. NON-BLOCKING EMAILS
    Promise.all([
      this.emailService.sendLeadAssignedToCounselor(counselor, newLead),
      this.emailService.sendLeadCreatedToAdmins(admins, newLead),
    ]).catch((err) => {
      console.error("Email error:", err);
    });

    return newLead;
  }

  // Fetch leads with filters and optional pagination
  async findAll(filters: any, user: any) {
    const {
      search,
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
      const leads = await this.prisma.lead.findMany({
        where,
        include: {
          counselor: true,
          notes: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // RBAC: hide source for counselors
      if (user?.role === "COUNSELOR") {
        return leads.map((lead) => {
          const { source, ...rest } = lead;
          return rest;
        });
      }

      return leads;
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
  async updateLead(id: string, dto: UpdateLeadDto, user: any) {
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
      include: { notes: true },
    });

    if (!existingLead) {
      throw new NotFoundException("Lead not found");
    }

    // 1. Ensure phone number is unique
    if (dto.phone && dto.phone !== existingLead.phone) {
      const phoneExists = await this.prisma.lead.findUnique({
        where: { phone: dto.phone },
      });

      if (phoneExists) {
        throw new BadRequestException("Lead with this phone already exists");
      }
    }

    // 2. Validate counselor assignment
    if (dto.counselorId) {
      const counselor = await this.prisma.user.findUnique({
        where: { id: dto.counselorId },
      });

      if (!counselor) {
        throw new BadRequestException("Invalid counselor ID");
      }
    }

    // 3. LOST status requires reason
    if (
      dto.status === "LOST" &&
      (!dto.lostReason || dto.lostReason.trim() === "")
    ) {
      throw new BadRequestException(
        "Lost reason is required when marking lead as LOST",
      );
    }

    // 4. Update lead fields (exclude notes)
    const { notes, ...leadData } = dto;

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...leadData,
        lostReason: dto.lostReason ? (dto.lostReason as LostReason) : undefined,
      },
    });

    // 5. HANDLE NOTES (ADD + UPDATE)
    if (notes && notes.length > 0) {
      const cleanedNotes = notes
        .map((n) => ({
          id: n.id,
          content: n.content.trim(),
        }))
        .filter((n) => n.content.length > 0);

      for (const note of cleanedNotes) {
        if (note.id) {
          // UPDATE existing note
          await this.prisma.leadNote.update({
            where: { id: note.id },
            data: { content: note.content },
          });
        } else {
          // CREATE new note
          await this.prisma.leadNote.create({
            data: {
              content: note.content,
              leadId: id,
            },
          });
        }
      }

      // Activity log for notes
      await this.prisma.leadActivity.create({
        data: {
          type: "NOTE",
          message: "Notes updated",
          leadId: id,
          userId: user.id,
        },
      });
    }

    // 6. Log status change
    if (dto.status && dto.status !== existingLead.status) {
      await this.prisma.leadActivity.create({
        data: {
          type: "STATUS_CHANGE",
          message: `Status changed from ${existingLead.status} to ${dto.status}`,
          leadId: id,
          userId: user.id,
        },
      });
    }

    // 7. Log edit activity
    await this.prisma.leadActivity.create({
      data: {
        type: "EDIT",
        message: "Lead details updated",
        leadId: id,
        userId: user.id,
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

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [{ message: { contains: search, mode: "insensitive" } }];
    }

    return this.prisma.leadActivity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Log a call activity for a lead.
  async logCall(leadId: string, dto: CreateCallLogDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Outcomes that REQUIRE a follow-up
    const followUpRequiredOutcomes = [
      "SCHEDULE_CALLBACK",
      "NO_ANSWER",
      "VOICEMAIL",
    ];

    if (followUpRequiredOutcomes.includes(dto.outcome) && !dto.followUpDate) {
      throw new BadRequestException(
        "Follow-up date is required for this call outcome",
      );
    }

    // Convert follow-up date if provided
    const followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;

    // Log call activity
    await this.prisma.leadActivity.create({
      data: {
        type: "CALL",
        message: `Call logged - ${dto.outcome}`,
        leadId,
        meta: {
          outcome: dto.outcome,
          notes: dto.notes ?? null,
          duration: dto.duration ?? null,
          rating: dto.rating ?? null,
          followUpDate: followUpDate,
        },
      },
    });

    // Update lead follow-up date only if provided
    if (followUpDate) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          followUpDate: followUpDate,
        },
      });
    }

    return {
      message: "Call logged successfully",
    };
  }

  // Mark a lead as LOST
  async markAsLost(id: string, dto: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Prevent marking an already lost lead again
    if (lead.status === "LOST") {
      throw new BadRequestException("Lead is already marked as LOST");
    }

    // Ensure lost reason is provided before marking lead as lost
    if (!dto.lostReason || dto.lostReason.trim() === "") {
      throw new BadRequestException(
        "Lost reason is required before marking a lead as LOST",
      );
    }

    // Update lead status to LOST and store the reason
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: "LOST",
        lostReason: dto.lostReason as LostReason,
      },
    });

    // Log activity for status change
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
      // Log activity for note addition
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

  // Send email to lead using template
  async sendTemplateEmail(leadId: string, templateId: string) {
    // Fetch the lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Ensure the lead has an email address
    if (!lead.email) {
      throw new BadRequestException("Lead email not available");
    }

    // Fetch email template
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException("Email template not found");
    }

    // Replace template variables
    const personalizedMessage = template.content.replace(
      "{{name}}",
      lead.fullName ?? "Student",
    );

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"Abroad Scholars" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: template.subject,
      html: personalizedMessage,

      attachments: [
        {
          filename: "Abroad-Scholar-Brochure.pdf",
          path: path.join(
            process.cwd(),
            "assets/brochures/abroad-scholar-brochure.pdf",
          ),
        },
      ],
    });

    // Log email activity in lead timeline
    await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL",
        message: `Email sent using template: ${template.name}`,
        meta: {
          templateId: template.id,
          subject: template.subject,
        },
      },
    });

    return {
      message: "Email sent successfully",
    };
  }
}
