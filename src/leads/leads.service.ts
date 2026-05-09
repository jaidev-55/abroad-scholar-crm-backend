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
import { NotificationsGateway } from "../notifications/notifications.gateway";

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateLeadDto, user: any) {
    // Normalise user.id — JWT strategy may return sub or userId instead of id
    user = { ...user, id: user.id ?? user.sub ?? user.userId };

    // 1. Prevent duplicate
    const existing = await this.prisma.lead.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException("Lead with this phone already exists");
    }

    const assignmentType = dto.assignmentType ?? "AUTO";
    let assignedCounselorId: string | undefined;
    let counselorRecord: any = null;

    // CASE 1: Counselor creating their own lead
    if (user.role === "COUNSELOR") {
      if (!user?.id) {
        throw new BadRequestException(
          "User ID is missing from request context",
        );
      }
      assignedCounselorId = user.id;
      counselorRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
    }

    // CASE 2: ADMIN / others
    else {
      if (assignmentType === "MANUAL") {
        // Manual — counselorId required
        if (!dto.counselorId) {
          throw new BadRequestException(
            "Counselor is required for manual assignment",
          );
        }
        counselorRecord = await this.prisma.user.findUnique({
          where: { id: dto.counselorId },
        });
        if (!counselorRecord) {
          throw new BadRequestException("Invalid counselor ID");
        }
        assignedCounselorId = dto.counselorId;
      } else {
        // AUTO — round-robin among counselors
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

        let nextIndex = 0;
        if (lastLead) {
          const lastIndex = counselors.findIndex(
            (c) => c.id === lastLead.counselorId,
          );
          nextIndex =
            lastIndex === -1 ? 0 : (lastIndex + 1) % counselors.length;
        }

        counselorRecord = counselors[nextIndex];
        assignedCounselorId = counselorRecord.id;
      }
    }

    // 3. Create lead — counselorId is now always valid or undefined
    const newLead = await this.prisma.lead.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        country: dto.country || null,
        source: dto.source,
        priority: dto.priority,
        ieltsScore: dto.ieltsScore,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        counselorId: assignedCounselorId ?? null,
        status: dto.status ?? "NEW",
        category: dto.category ?? null,
      },
    });

    // 4. Save notes
    if (dto.notes && dto.notes.length > 0) {
      await this.prisma.leadNote.createMany({
        data: dto.notes.map((note) => ({
          content: note,
          leadId: newLead.id,
        })),
      });

      await this.prisma.leadActivity.create({
        data: {
          type: "NOTE",
          message: `${dto.notes.length} note(s) added during lead creation`,
          leadId: newLead.id,
          userId: user.id,
        },
      });
    }

    // 5. Activity log
    await this.prisma.leadActivity.create({
      data: {
        type: "EDIT",
        message: "Lead created and assigned to counselor",
        leadId: newLead.id,
        userId: user.id,
      },
    });

    // 6. Non-blocking emails (only if counselor was assigned)
    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    Promise.all([
      counselorRecord
        ? this.emailService.sendLeadAssignedToCounselor(
            counselorRecord,
            newLead,
          )
        : Promise.resolve(),
      this.emailService.sendLeadCreatedToAdmins(admins, newLead),
    ]).catch((err) => {
      console.error("Email error:", err);
    });

    this.notificationsGateway.pushToAll({
      id: `new-${newLead.id}`,
      type: "new_lead",
      title: `New lead: ${newLead.fullName}`,
      subtitle: `From ${newLead.source?.replace(/_/g, " ")} — ${newLead.country ?? ""}`,
      time: newLead.createdAt.toISOString(),
      priority: "low",
      leadId: newLead.id,
      read: false,
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

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (source) where.source = source;
    if (counselorId) where.counselorId = counselorId;
    if (country) where.country = country;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (lostReason) where.lostReason = lostReason;
    if (filters.category) where.category = filters.category;
    if (filters.pipelineStatus) where.pipelineStatus = filters.pipelineStatus;

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (followUpFrom && followUpTo) {
      where.followUpDate = {
        gte: new Date(followUpFrom),
        lte: new Date(followUpTo),
      };
    }

    if (!page || !limit) {
      const leads = await this.prisma.lead.findMany({
        where,
        include: {
          counselor: true,
          notes: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (user?.role === "COUNSELOR") {
        return leads.map((lead) => {
          const { source, ...rest } = lead;
          return rest;
        });
      }

      return leads;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          counselor: true,
          notes: {
            include: { user: { select: { id: true, name: true } } },
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
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        counselor: true,
        notes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    return lead;
  }

  async updateLead(id: string, dto: UpdateLeadDto, user: any) {
    user = { ...user, id: user.id ?? user.sub ?? user.userId };
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
      include: { notes: true },
    });

    if (!existingLead) {
      throw new NotFoundException("Lead not found");
    }

    if (dto.phone && dto.phone !== existingLead.phone) {
      const phoneExists = await this.prisma.lead.findUnique({
        where: { phone: dto.phone },
      });

      if (phoneExists) {
        throw new BadRequestException("Lead with this phone already exists");
      }
    }

    let assignedCounselorId = existingLead.counselorId;

    const incomingCounselorId = dto.counselorId?.trim() || null;

    if (incomingCounselorId) {
      const counselor = await this.prisma.user.findUnique({
        where: { id: incomingCounselorId },
      });

      if (!counselor) {
        throw new BadRequestException("Invalid counselor ID");
      }

      assignedCounselorId = incomingCounselorId;
    }

    if (
      dto.status === "LOST" &&
      (!dto.lostReason || dto.lostReason.trim() === "")
    ) {
      throw new BadRequestException(
        "Lost reason is required when marking lead as LOST",
      );
    }

    const { notes, followUpDate, lostReason, ...leadData } = dto;

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...leadData,
        counselorId: assignedCounselorId,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        lostReason: lostReason ? (lostReason as LostReason) : undefined,
      },
    });

    if (notes && notes.length > 0) {
      const cleanedNotes = notes
        .map((n) => ({ id: n.id, content: n.content.trim() }))
        .filter((n) => n.content.length > 0);

      for (const note of cleanedNotes) {
        if (note.id) {
          const existingNote = await this.prisma.leadNote.findUnique({
            where: { id: note.id },
          });

          if (existingNote) {
            await this.prisma.leadNote.update({
              where: { id: note.id },
              data: { content: note.content },
            });
          } else {
            await this.prisma.leadNote.create({
              data: { content: note.content, leadId: id },
            });
          }
        } else {
          await this.prisma.leadNote.create({
            data: { content: note.content, leadId: id },
          });
        }
      }
    }

    if (dto.counselorId && dto.counselorId !== existingLead.counselorId) {
      await this.prisma.leadActivity.create({
        data: {
          type: "EDIT",
          message: "Counselor reassigned",
          leadId: id,
          userId: user.id,
          meta: { from: existingLead.counselorId, to: dto.counselorId },
        },
      });
    }

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

  async deleteLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Blacklist phone so webhook cron never re-imports it
    await this.prisma.deletedLeadPhone.upsert({
      where: { phone: lead.phone },
      update: { name: lead.fullName },
      create: { phone: lead.phone, name: lead.fullName },
    });

    await this.prisma.lead.delete({ where: { id } });
    return { message: "Lead deleted successfully" };
  }

  async deleteMultiple(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException("No IDs provided");
    }

    const found = await this.prisma.lead.findMany({
      where: { id: { in: ids } },
      select: { id: true, phone: true, fullName: true },
    });

    if (found.length !== ids.length) {
      const foundIds = found.map((l) => l.id);
      const missing = ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Leads not found: ${missing.join(", ")}`);
    }

    // Blacklist all phones so webhook cron never re-imports them
    await Promise.all(
      found.map((l) =>
        this.prisma.deletedLeadPhone.upsert({
          where: { phone: l.phone },
          update: { name: l.fullName },
          create: { phone: l.phone, name: l.fullName },
        }),
      ),
    );

    const result = await this.prisma.lead.deleteMany({
      where: { id: { in: ids } },
    });

    return { message: `${result.count} lead(s) deleted successfully` };
  }

  async getStats() {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const total = await this.prisma.lead.count();
    const newToday = await this.prisma.lead.count({
      where: { createdAt: { gte: startOfToday } },
    });
    const followUpsDue = await this.prisma.lead.count({
      where: {
        followUpDate: { lte: now },
        status: { notIn: ["CONVERTED", "LOST"] },
      },
    });
    const converted = await this.prisma.lead.count({
      where: { status: "CONVERTED" },
    });
    const lost = await this.prisma.lead.count({ where: { status: "LOST" } });

    return { total, newToday, followUpsDue, converted, lost };
  }

  async getActivity(leadId: string, type?: ActivityType, search?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    const where: any = { leadId };
    if (type) where.type = type;
    if (search)
      where.OR = [{ message: { contains: search, mode: "insensitive" } }];

    return this.prisma.leadActivity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async logCall(leadId: string, dto: CreateCallLogDto, user: any) {
    user = { ...user, id: user.id ?? user.sub ?? user.userId };
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

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

    const followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;

    await this.prisma.callLog.create({
      data: {
        outcome: dto.outcome as any,
        leadId,
        counselorId: user.id,
        notes: dto.notes ?? null,
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        type: "CALL",
        message: `Call logged - ${dto.outcome}${dto.pipelineStatus ? ` | Pipeline: ${dto.pipelineStatus}` : ""}`,
        leadId,
        userId: user.id,
        meta: {
          outcome: dto.outcome,
          pipelineStatus: dto.pipelineStatus ?? null,
          notes: dto.notes ?? null,
          duration: dto.duration ?? null,
          rating: dto.rating ?? null,
          followUpDate: followUpDate,
        },
      },
    });

    // Build the lead update payload
    const leadUpdateData: any = {};
    if (followUpDate) leadUpdateData.followUpDate = followUpDate;
    if (dto.pipelineStatus) leadUpdateData.pipelineStatus = dto.pipelineStatus;

    if (Object.keys(leadUpdateData).length > 0) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: leadUpdateData,
      });
    }

    return { message: "Call logged successfully" };
  }

  async getCallLogs(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    const callActivities = await this.prisma.leadActivity.findMany({
      where: { leadId, type: "CALL" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCalls = callActivities.length;
    const callsWithDuration = callActivities.filter(
      (a) => (a.meta as any)?.duration,
    );
    const avgDurationSeconds =
      callsWithDuration.length > 0
        ? Math.round(
            callsWithDuration.reduce(
              (sum, a) => sum + ((a.meta as any).duration as number),
              0,
            ) / callsWithDuration.length,
          )
        : 0;
    const conversions = callActivities.filter(
      (a) => (a.meta as any)?.outcome === "CONVERTED",
    ).length;
    const outcomeCounts: Record<string, number> = {};
    for (const activity of callActivities) {
      const outcome = (activity.meta as any)?.outcome;
      if (outcome) outcomeCounts[outcome] = (outcomeCounts[outcome] ?? 0) + 1;
    }

    return {
      summary: { totalCalls, avgDurationSeconds, conversions, outcomeCounts },
      calls: callActivities,
    };
  }

  async markAsLost(id: string, dto: any) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });

    if (!lead) throw new NotFoundException("Lead not found");
    if (lead.status === "LOST") {
      throw new BadRequestException("Lead is already marked as LOST");
    }
    if (!dto.lostReason || dto.lostReason.trim() === "") {
      throw new BadRequestException(
        "Lost reason is required before marking a lead as LOST",
      );
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: { status: "LOST", lostReason: dto.lostReason as LostReason },
    });

    await this.prisma.leadActivity.create({
      data: {
        type: "STATUS_CHANGE",
        message: `Lead marked as LOST. Reason: ${dto.lostReason}`,
        leadId: id,
      },
    });

    if (dto.additionalNotes) {
      await this.prisma.leadNote.create({
        data: { content: dto.additionalNotes, leadId: id },
      });
      await this.prisma.leadActivity.create({
        data: { type: "NOTE", message: "Lost reason note added", leadId: id },
      });
    }

    return updatedLead;
  }

  async addNote(leadId: string, dto: any, user?: any) {
    user = user ? { ...user, id: user.id ?? user.sub ?? user.userId } : null;

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException("Lead not found");

    const note = await this.prisma.leadNote.create({
      data: { content: dto.content, leadId, userId: user?.id ?? null },
    });

    await this.prisma.leadActivity.create({
      data: {
        type: "NOTE",
        message: "Note added",
        leadId,
        userId: user?.id ?? null,
      },
    });

    return note;
  }

  async sendTemplateEmail(leadId: string, templateId: string, user?: any) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException("Lead not found");
    if (!lead.email) throw new BadRequestException("Lead email not available");

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException("Email template not found");

    let fromEmail = process.env.EMAIL_USER as string;
    let fromName = "Abroad Scholars";

    if (user?.id) {
      const senderUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, name: true },
      });
      if (senderUser?.email) fromEmail = senderUser.email;
      if (senderUser?.name) fromName = senderUser.name;
    }

    const personalizedMessage = template.content
      .replace(/\{\{name\}\}/g, lead.fullName ?? "Student")
      .replace(/\n/g, "<br>");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: fromEmail,
      to: lead.email,
      subject: template.subject,
      html: personalizedMessage,
      attachments: (() => {
        if (!template.attachment) return [];
        const filePath = path.join(
          process.cwd(),
          "assets",
          "brochures",
          template.attachment,
        );
        try {
          const fs = require("fs");
          if (fs.existsSync(filePath)) {
            return [{ filename: template.attachment, path: filePath }];
          }
        } catch (e) {
          console.error("Attachment error:", e);
        }
        return [];
      })(),
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL",
        message: `Email sent using template: ${template.name}`,
        userId: user?.id ?? null,
        meta: {
          templateId: template.id,
          subject: template.subject,
          sentFrom: fromEmail,
        },
      },
    });

    return { message: "Email sent successfully" };
  }

  async sendCustomEmail(
    leadId: string,
    dto: { subject: string; message: string },
    user: any,
    attachment?: Express.Multer.File,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new BadRequestException("Lead not found");
    if (!lead.email) throw new BadRequestException("Lead email not available");

    let fromEmail = process.env.EMAIL_USER as string;
    let fromName = "Abroad Scholars";

    if (user?.id) {
      const senderUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, name: true },
      });
      if (senderUser?.email) fromEmail = senderUser.email;
      if (senderUser?.name) fromName = senderUser.name;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions: any = {
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: fromEmail,
      to: lead.email,
      subject: dto.subject,
      html: dto.message.replace(/\n/g, "<br>"),
    };

    if (attachment) {
      mailOptions.attachments = [
        { filename: attachment.originalname, content: attachment.buffer },
      ];
    }

    await transporter.sendMail(mailOptions);

    await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL",
        message: `Custom email sent: ${dto.subject}`,
        userId: user?.id ?? null,
        meta: { subject: dto.subject, sentFrom: fromEmail },
      },
    });

    return { message: "Email sent successfully" };
  }
}
