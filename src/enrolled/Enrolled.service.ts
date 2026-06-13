import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  EnrollmentStage,
  VisaStatus,
  FeeStatus,
  RiskType,
  Prisma,
  CommissionStatus,
} from "@prisma/client";
import { CreateEnrolledStudentDto } from "./dto/Create enrolled.dto";
import { EnrolledQueryDto } from "./dto/Enrolled query.dto";
import { UpdateEnrolledStudentDto } from "./dto/Update enrolled.dto";
import {
  CreateCommissionDto,
  UpdateCommissionDto,
  RecordCommissionPaymentDto,
} from "./dto/Commission.dto";
import { UploadDocumentDto, UpdateDocumentDto } from "./dto/Document.dto";
import {
  CreateFeePaymentDto,
  UpdateFeePaymentDto,
} from "./dto/Fee payment.dto";
import {
  CreatePreDepartureDto,
  UpdatePreDepartureDto,
} from "./dto/Pre departure.dto";
import { UpdateVisaDetailDto } from "./dto/Visa detail.dto";

@Injectable()
export class EnrolledService {
  constructor(private prisma: PrismaService) {}

  // GENERATE STUDENT ID

  private async generateStudentId(): Promise<string> {
    const lastStudent = await this.prisma.enrolledStudent.findFirst({
      orderBy: { createdAt: "desc" },
      select: { studentId: true },
    });

    if (!lastStudent) return "STU-1000";

    const lastNum = parseInt(lastStudent.studentId.replace("STU-", ""), 10);
    return `STU-${lastNum + 1}`;
  }

  // COMPUTE FEE STATUS FROM AMOUNTS

  private computeFeeStatus(totalFee: number, feePaid: number): FeeStatus {
    if (totalFee <= 0) return FeeStatus.PENDING;
    if (feePaid >= totalFee) return FeeStatus.PAID;
    if (feePaid > 0) return FeeStatus.PARTIAL;
    return FeeStatus.PENDING;
  }

  // CREATE ENROLLED STUDENT

  async create(dto: CreateEnrolledStudentDto, userId?: string) {
    // Check for duplicate phone
    const existing = await this.prisma.enrolledStudent.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException(
        "A student with this phone number already exists",
      );
    }

    const studentId = await this.generateStudentId();
    const totalFee = dto.totalFee || 0;
    const feePaid = dto.feePaid || 0;
    const feeStatus = dto.feeStatus || this.computeFeeStatus(totalFee, feePaid);

    const student = await this.prisma.enrolledStudent.create({
      data: {
        studentId,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        source: dto.source,
        ieltsScore: dto.ieltsScore,
        country: dto.country,
        university: dto.university,
        course: dto.course,
        intakeDate: new Date(dto.intakeDate),
        counselorId: dto.counselorId,
        totalFee,
        feePaid,
        feeStatus,
        feeCurrency: dto.feeCurrency || "USD",
        visaStatus: dto.visaStatus || VisaStatus.NOT_STARTED,
        visaAppDate: dto.visaAppDate ? new Date(dto.visaAppDate) : null,
        casRef: dto.casRef,
        notes: dto.notes,
        leadId: dto.leadId,
      },
      include: {
        counselor: { select: { id: true, name: true, email: true } },
        risks: true,
      },
    });

    // Log enrollment activity
    await this.prisma.enrollmentActivity.create({
      data: {
        type: "ENROLLED",
        message: `${dto.fullName} enrolled for ${dto.course} at ${dto.university}`,
        studentId: student.id,
        userId,
      },
    });

    // Auto-detect risks
    await this.autoDetectRisks(student.id);

    return student;
  }

  // GET ALL WITH FILTERS, SEARCH, PAGINATION

  async findAll(query: EnrolledQueryDto) {
    const {
      search,
      country,
      counselorId,
      visaStatus,
      stage,
      feeStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.EnrolledStudentWhereInput = {};

    // Text search on name or studentId
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (country) where.country = country;
    if (counselorId) where.counselorId = counselorId;
    if (visaStatus) where.visaStatus = visaStatus;
    if (stage) where.stage = stage;
    if (feeStatus) where.feeStatus = feeStatus;

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      this.prisma.enrolledStudent.findMany({
        where,
        include: {
          counselor: { select: { id: true, name: true } },
          risks: { where: { isResolved: false } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.enrolledStudent.count({ where }),
    ]);

    // Compute fee percentage for each student
    const enriched = students.map((s) => ({
      ...s,
      feePercent:
        s.totalFee > 0 ? Math.round((s.feePaid / s.totalFee) * 100) : 0,
      riskCount: s.risks.length,
    }));

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET SINGLE STUDENT BY ID

  async findOne(id: string) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id },
      include: {
        counselor: { select: { id: true, name: true, email: true } },
        // Overview tab: fee line items
        feePayments: { orderBy: { createdAt: "desc" } },

        // Visa tab: passport & visa details
        visaDetail: true,

        // Documents tab
        documents: { orderBy: { uploadedAt: "desc" } },

        // Pre-Departure tab
        preDeparture: { orderBy: { createdAt: "asc" } },

        // Commission tab
        commission: {
          include: { payments: { orderBy: { createdAt: "desc" } } },
        },

        // Risks & Activities
        risks: { orderBy: { createdAt: "desc" } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!student) throw new NotFoundException("Enrolled student not found");

    // Compute derived values
    const feePercent =
      student.totalFee > 0
        ? Math.round((student.feePaid / student.totalFee) * 100)
        : 0;

    const riskCount = student.risks.filter((r) => !r.isResolved).length;

    // Intake countdown
    const now = new Date();
    const daysToIntake = Math.ceil(
      (student.intakeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Pre-departure completion percentage
    const totalChecklist = student.preDeparture.length;
    const completedChecklist = student.preDeparture.filter(
      (p) => p.isCompleted,
    ).length;
    const checklistPercent =
      totalChecklist > 0
        ? Math.round((completedChecklist / totalChecklist) * 100)
        : 0;

    // Commission pending
    const commissionPending = student.commission
      ? student.commission.expectedAmount - student.commission.receivedAmount
      : 0;

    return {
      ...student,
      feePercent,
      riskCount,
      daysToIntake,
      checklistPercent,
      commissionPending,
    };
  }

  // VISA  Passport & Visa Processing
  async getVisaDetail(studentId: string) {
    const detail = await this.prisma.visaDetail.findUnique({
      where: { studentId },
    });
    return detail;
  }

  async upsertVisaDetail(
    studentId: string,
    dto: UpdateVisaDetailDto,
    userId?: string,
  ) {
    // Verify student exists
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Student not found");

    const data = {
      passportNumber: dto.passportNumber,
      passportExpiry: dto.passportExpiry
        ? new Date(dto.passportExpiry)
        : undefined,
      visaType: dto.visaType,
      visaStatus: dto.visaStatus,
      filingDate: dto.filingDate ? new Date(dto.filingDate) : undefined,
      biometricDate: dto.biometricDate
        ? new Date(dto.biometricDate)
        : undefined,
      interviewDate: dto.interviewDate
        ? new Date(dto.interviewDate)
        : undefined,
      decisionDate: dto.decisionDate ? new Date(dto.decisionDate) : undefined,
    };

    const visa = await this.prisma.visaDetail.upsert({
      where: { studentId },
      create: { ...data, studentId },
      update: data,
    });

    if (dto.visaStatus) {
      await this.prisma.enrolledStudent.update({
        where: { id: studentId },
        data: { visaStatus: dto.visaStatus },
      });
    }

    // Log activity
    await this.prisma.enrollmentActivity.create({
      data: {
        type: "VISA_UPDATE",
        message: `Visa details updated${dto.visaStatus ? `: status → ${dto.visaStatus}` : ""}`,
        studentId,
        userId,
      },
    });

    return visa;
  }

  // FEE PAYMENT LINE ITEMS
  async getFeePayments(studentId: string) {
    return this.prisma.feePayment.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
    });
  }

  // Add a new fee line item
  async createFeePayment(
    studentId: string,
    dto: CreateFeePaymentDto,
    userId?: string,
  ) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Student not found");

    const payment = await this.prisma.feePayment.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status || "PENDING",
        paymentMode: dto.paymentMode,
        notes: dto.notes,
        studentId,
      },
    });

    // Recalculate the student's totalFee and feePaid from all line items
    await this.recalculateStudentFees(studentId);

    // Log activity
    await this.prisma.enrollmentActivity.create({
      data: {
        type: "FEE_PAYMENT",
        message: `Fee added: ${dto.type} - ${dto.amount}`,
        studentId,
        userId,
      },
    });

    return payment;
  }

  // Update a fee line item (mark as paid, change amount, etc.)

  async updateFeePayment(
    studentId: string,
    feeId: string,
    dto: UpdateFeePaymentDto,
    userId?: string,
  ) {
    const fee = await this.prisma.feePayment.findUnique({
      where: { id: feeId },
    });
    if (!fee) throw new NotFoundException("Fee payment not found");

    const updated = await this.prisma.feePayment.update({
      where: { id: feeId },
      data: {
        type: dto.type,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        paymentMode: dto.paymentMode,
        paidDate: dto.paidDate ? new Date(dto.paidDate) : undefined,
        notes: dto.notes,
      },
    });

    await this.recalculateStudentFees(studentId);

    if (dto.status === "PAID") {
      await this.prisma.enrollmentActivity.create({
        data: {
          type: "FEE_PAYMENT",
          message: `Fee paid: ${updated.type} — ${updated.amount}`,
          studentId,
          userId,
        },
      });
    }

    return updated;
  }

  // DELETE
  async deleteFeePayment(studentId: string, feeId: string) {
    await this.prisma.feePayment.delete({ where: { id: feeId } });
    await this.recalculateStudentFees(studentId);
    return { message: "Fee payment deleted" };
  }

  // recalculate totalFee & feePaid on the student record
  private async recalculateStudentFees(studentId: string) {
    const fees = await this.prisma.feePayment.findMany({
      where: { studentId },
    });

    const totalFee = fees.reduce((sum, f) => sum + f.amount, 0);
    const feePaid = fees
      .filter((f) => f.status === "PAID")
      .reduce((sum, f) => sum + f.amount, 0);

    const feeStatus = this.computeFeeStatus(totalFee, feePaid);

    await this.prisma.enrolledStudent.update({
      where: { id: studentId },
      data: { totalFee, feePaid, feeStatus },
    });
  }

  //  DOCUMENTS — Upload, verify, manage

  async getDocuments(studentId: string) {
    return this.prisma.enrollmentDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  // Upload Document

  async createDocument(
    studentId: string,
    dto: UploadDocumentDto,
    fileUrl: string,
    fileType: string,
    userId?: string,
  ) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Student not found");

    const doc = await this.prisma.enrollmentDocument.create({
      data: {
        name: dto.name,
        fileUrl,
        fileType,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        notes: dto.notes,
        studentId,
      },
    });

    await this.prisma.enrollmentActivity.create({
      data: {
        type: "DOCUMENT_UPLOAD",
        message: `Document uploaded: ${dto.name}`,
        studentId,
        userId,
      },
    });

    return doc;
  }

  // Update document status

  async updateDocument(
    docId: string,
    dto: UpdateDocumentDto,
    newFileUrl?: string,
    userId?: string,
  ) {
    const doc = await this.prisma.enrollmentDocument.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException("Document not found");

    const updated = await this.prisma.enrollmentDocument.update({
      where: { id: docId },
      data: {
        status: dto.status,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
        name: dto.name,
        ...(newFileUrl ? { fileUrl: newFileUrl } : {}),
      },
    });

    if (dto.status === "VERIFIED") {
      await this.prisma.enrollmentActivity.create({
        data: {
          type: "DOCUMENT_UPLOAD",
          message: `Document verified: ${updated.name}`,
          studentId: doc.studentId,
          userId,
        },
      });
    }

    return updated;
  }

  // DELETE DOCS

  async deleteDocument(docId: string, userId?: string) {
    const doc = await this.prisma.enrollmentDocument.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException("Document not found");

    await this.prisma.enrollmentDocument.delete({ where: { id: docId } });

    await this.prisma.enrollmentActivity.create({
      data: {
        type: "DOCUMENT_UPLOAD",
        message: `Document deleted: ${doc.name}`,
        studentId: doc.studentId,
        userId,
      },
    });

    return { message: "Document deleted" };
  }

  // PRE-DEPARTURE CHECKLIST
  async getPreDeparture(studentId: string) {
    const items = await this.prisma.preDepartureItem.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
    });

    const total = items.length;
    const completed = items.filter((i) => i.isCompleted).length;

    return {
      items,
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  //Add Checklist Item
  async createPreDepartureItem(
    studentId: string,
    dto: CreatePreDepartureDto,
    userId?: string,
  ) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Student not found");

    return this.prisma.preDepartureItem.create({
      data: {
        taskName: dto.taskName,
        category: dto.category,
        notes: dto.notes,
        studentId,
      },
    });
  }

  // Quick checkbox toggle — click the checkmark on a checklist item
  async togglePreDepartureItem(itemId: string) {
    const item = await this.prisma.preDepartureItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException("Checklist item not found");

    return this.prisma.preDepartureItem.update({
      where: { id: itemId },
      data: {
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date() : null,
      },
    });
  }

  // Toggle completion or update details
  async updatePreDepartureItem(itemId: string, dto: UpdatePreDepartureDto) {
    const item = await this.prisma.preDepartureItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException("Checklist item not found");

    return this.prisma.preDepartureItem.update({
      where: { id: itemId },
      data: {
        taskName: dto.taskName,
        category: dto.category,
        isCompleted: dto.isCompleted,
        completedAt:
          dto.isCompleted === true
            ? new Date()
            : dto.isCompleted === false
              ? null
              : undefined,
        attachmentUrl: dto.attachmentUrl,
        notes: dto.notes,
      },
    });
  }

  async deletePreDepartureItem(itemId: string) {
    await this.prisma.preDepartureItem.delete({ where: { id: itemId } });
    return { message: "Checklist item deleted" };
  }

  // COMMISSION TRACKING

  async getCommission(studentId: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { studentId },
      include: { payments: { orderBy: { createdAt: "desc" } } },
    });

    if (!commission) return null;

    return {
      ...commission,
      pendingAmount: commission.expectedAmount - commission.receivedAmount,
    };
  }

  // Add Commission

  async createCommission(
    studentId: string,
    dto: CreateCommissionDto,
    userId?: string,
  ) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Student not found");

    // Check if commission already exists
    const existing = await this.prisma.commission.findUnique({
      where: { studentId },
    });
    if (existing) {
      throw new ConflictException("Commission already exists for this student");
    }

    const receivedAmount = dto.receivedAmount || 0;
    const status =
      receivedAmount >= dto.expectedAmount
        ? CommissionStatus.PAID
        : receivedAmount > 0
          ? CommissionStatus.PARTIAL
          : CommissionStatus.PENDING;

    return this.prisma.commission.create({
      data: {
        universityRate: dto.universityRate,
        subAgentRate: dto.subAgentRate || 0,
        expectedAmount: dto.expectedAmount,
        receivedAmount,
        status,
        notes: dto.notes,
        studentId,
      },
    });
  }

  // Edit commission details
  async updateCommission(studentId: string, dto: UpdateCommissionDto) {
    const commission = await this.prisma.commission.findUnique({
      where: { studentId },
    });
    if (!commission) throw new NotFoundException("Commission not found");

    return this.prisma.commission.update({
      where: { studentId },
      data: {
        universityRate: dto.universityRate,
        subAgentRate: dto.subAgentRate,
        expectedAmount: dto.expectedAmount,
        status: dto.status,
        agreementUrl: dto.agreementUrl,
        notes: dto.notes,
      },
    });
  }

  // Record Payment
  async recordCommissionPayment(
    studentId: string,
    dto: RecordCommissionPaymentDto,
    userId?: string,
  ) {
    const commission = await this.prisma.commission.findUnique({
      where: { studentId },
    });
    if (!commission) throw new NotFoundException("Commission not found");

    // Create payment record
    const payment = await this.prisma.commissionPayment.create({
      data: {
        amount: dto.amount,
        notes: dto.notes,
        commissionId: commission.id,
      },
    });

    // Update running total on the commission
    const newReceived = commission.receivedAmount + dto.amount;
    const newStatus =
      newReceived >= commission.expectedAmount
        ? CommissionStatus.PAID
        : CommissionStatus.PARTIAL;

    await this.prisma.commission.update({
      where: { id: commission.id },
      data: {
        receivedAmount: newReceived,
        status: newStatus,
      },
    });

    // Log activity
    await this.prisma.enrollmentActivity.create({
      data: {
        type: "FEE_PAYMENT",
        message: `Commission payment received: $${dto.amount}`,
        studentId,
        userId,
      },
    });

    return {
      payment,
      receivedAmount: newReceived,
      pendingAmount: commission.expectedAmount - newReceived,
      status: newStatus,
    };
  }

  // UPDATE STUDENT

  async update(id: string, dto: UpdateEnrolledStudentDto, userId?: string) {
    const existing = await this.prisma.enrolledStudent.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Enrolled student not found");

    // If phone is being changed, check uniqueness
    if (dto.phone && dto.phone !== existing.phone) {
      const phoneExists = await this.prisma.enrolledStudent.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException("Phone number already in use");
      }
    }

    // Build update data
    const updateData: Prisma.EnrolledStudentUpdateInput = {};
    const changes: string[] = [];

    // Track stage changes
    if (dto.stage && dto.stage !== existing.stage) {
      updateData.stage = dto.stage;
      changes.push(`Stage changed from ${existing.stage} to ${dto.stage}`);
    }

    // Track visa status changes
    if (dto.visaStatus && dto.visaStatus !== existing.visaStatus) {
      updateData.visaStatus = dto.visaStatus;
      changes.push(
        `Visa status changed from ${existing.visaStatus} to ${dto.visaStatus}`,
      );
    }

    // Track fee changes
    if (dto.feePaid !== undefined && dto.feePaid !== existing.feePaid) {
      updateData.feePaid = dto.feePaid;
      const totalFee = dto.totalFee ?? existing.totalFee;
      updateData.feeStatus = this.computeFeeStatus(totalFee, dto.feePaid);
      changes.push(`Fee payment updated: ${dto.feePaid}`);
    }

    // Copy remaining fields
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.email) updateData.email = dto.email;
    if (dto.source) updateData.source = dto.source;
    if (dto.ieltsScore !== undefined) updateData.ieltsScore = dto.ieltsScore;
    if (dto.country) updateData.country = dto.country;
    if (dto.university) updateData.university = dto.university;
    if (dto.course) updateData.course = dto.course;
    if (dto.intakeDate) updateData.intakeDate = new Date(dto.intakeDate);
    if (dto.counselorId)
      updateData.counselor = { connect: { id: dto.counselorId } };
    if (dto.totalFee !== undefined) updateData.totalFee = dto.totalFee;
    if (dto.feeCurrency) updateData.feeCurrency = dto.feeCurrency;
    if (dto.visaAppDate) updateData.visaAppDate = new Date(dto.visaAppDate);
    if (dto.visaDecDate) updateData.visaDecDate = new Date(dto.visaDecDate);
    if (dto.casRef) updateData.casRef = dto.casRef;
    if (dto.travelDate) updateData.travelDate = new Date(dto.travelDate);
    if (dto.travelReady !== undefined) updateData.travelReady = dto.travelReady;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const student = await this.prisma.enrolledStudent.update({
      where: { id },
      data: updateData,
      include: {
        counselor: { select: { id: true, name: true, email: true } },
        risks: { where: { isResolved: false } },
      },
    });

    // Log activity for significant changes
    for (const change of changes) {
      const type = change.includes("Stage")
        ? "STAGE_CHANGE"
        : change.includes("Visa")
          ? "VISA_UPDATE"
          : change.includes("Fee")
            ? "FEE_PAYMENT"
            : "EDIT";

      await this.prisma.enrollmentActivity.create({
        data: {
          type: type as any,
          message: change,
          studentId: id,
          userId,
          meta: JSON.parse(
            JSON.stringify({ previous: existing, updated: dto }),
          ),
        },
      });
    }

    // Re-evaluate risks after update
    await this.autoDetectRisks(id);

    return student;
  }

  // UPDATE STAGE (Dedicated endpoint for pipeline)

  async updateStage(id: string, stage: EnrollmentStage, userId?: string) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException("Enrolled student not found");

    const updated = await this.prisma.enrolledStudent.update({
      where: { id },
      data: { stage },
      include: {
        counselor: { select: { id: true, name: true } },
        risks: { where: { isResolved: false } },
      },
    });

    await this.prisma.enrollmentActivity.create({
      data: {
        type: "STAGE_CHANGE",
        message: `Stage changed from ${student.stage} to ${stage}`,
        studentId: id,
        userId,
        meta: { previousStage: student.stage, newStage: stage },
      },
    });

    await this.autoDetectRisks(id);

    return updated;
  }

  // DELETE STUDENT

  async remove(id: string) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException("Enrolled student not found");

    await this.prisma.enrolledStudent.delete({ where: { id } });

    return {
      message: "Student deleted successfully",
      studentId: student.studentId,
    };
  }

  // DASHBOARD STATS (for stat cards)

  async getStats() {
    const [
      totalEnrolled,
      visaApproved,
      visaInProgress,
      visaNotStarted,
      feePaid,
      feePending,
      travelReady,
      atRiskStudents,
    ] = await Promise.all([
      this.prisma.enrolledStudent.count(),
      this.prisma.enrolledStudent.count({ where: { visaStatus: "APPROVED" } }),
      this.prisma.enrolledStudent.count({
        where: { visaStatus: "IN_PROGRESS" },
      }),
      this.prisma.enrolledStudent.count({
        where: { visaStatus: "NOT_STARTED" },
      }),
      this.prisma.enrolledStudent.count({ where: { feeStatus: "PAID" } }),
      this.prisma.enrolledStudent.count({
        where: { feeStatus: { in: ["PENDING", "PARTIAL"] } },
      }),
      this.prisma.enrolledStudent.count({ where: { travelReady: true } }),
      this.prisma.enrolledStudent.count({
        where: { risks: { some: { isResolved: false } } },
      }),
    ]);

    return {
      totalEnrolled,
      visaApproved,
      visaInProgress,
      visaNotStarted,
      feePaid,
      feePending,
      travelReady,
      atRisk: atRiskStudents,
    };
  }

  // GET FILTER OPTIONS (for dropdowns)

  async getFilterOptions() {
    const [countries, counselors] = await Promise.all([
      this.prisma.enrolledStudent.findMany({
        distinct: ["country"],
        select: { country: true },
        orderBy: { country: "asc" },
      }),
      this.prisma.user.findMany({
        where: { role: { in: ["COUNSELOR", "ADMIN"] } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      countries: countries.map((c) => c.country),
      counselors,
      visaStatuses: Object.values(VisaStatus),
      stages: Object.values(EnrollmentStage),
      feeStatuses: Object.values(FeeStatus),
    };
  }

  // ENROLL FROM EXISTING LEAD (convert lead)

  async enrollFromLead(
    leadId: string,
    dto: Partial<CreateEnrolledStudentDto>,
    userId?: string,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { counselor: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");

    // Check if lead is already enrolled
    const alreadyEnrolled = await this.prisma.enrolledStudent.findUnique({
      where: { leadId },
    });
    if (alreadyEnrolled) {
      throw new ConflictException("This lead is already enrolled");
    }

    const studentId = await this.generateStudentId();

    const student = await this.prisma.enrolledStudent.create({
      data: {
        studentId,
        fullName: lead.fullName,
        phone: lead.phone,
        email: dto.email || lead.email || "",
        source: lead.source,
        ieltsScore: lead.ieltsScore,
        country: dto.country || lead.country || "",
        university: dto.university || "",
        course: dto.course || "",
        intakeDate: dto.intakeDate ? new Date(dto.intakeDate) : new Date(),
        counselorId: dto.counselorId || lead.counselorId,
        totalFee: dto.totalFee || 0,
        feePaid: dto.feePaid || 0,
        notes: dto.notes,
        leadId: lead.id,
      },
      include: {
        counselor: { select: { id: true, name: true, email: true } },
      },
    });

    // Update lead status to CONVERTED
    await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: "CONVERTED" },
    });

    // Log activity
    await this.prisma.enrollmentActivity.create({
      data: {
        type: "ENROLLED",
        message: `Enrolled from lead: ${lead.fullName}`,
        studentId: student.id,
        userId,
        meta: { leadId: lead.id },
      },
    });

    return student;
  }

  // AUTO-DETECT RISKS

  private async autoDetectRisks(studentId: string) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
      include: { risks: { where: { isResolved: false } } },
    });
    if (!student) return;

    const now = new Date();
    const existingRiskTypes = new Set(student.risks.map((r) => r.type));
    const newRisks: { type: RiskType; message: string }[] = [];

    // Risk: Intake approaching within 60 days & visa not approved
    const daysToIntake = Math.ceil(
      (student.intakeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (
      daysToIntake <= 60 &&
      daysToIntake > 0 &&
      student.visaStatus !== "APPROVED" &&
      !existingRiskTypes.has("INTAKE_APPROACHING")
    ) {
      newRisks.push({
        type: RiskType.INTAKE_APPROACHING,
        message: `Intake in ${daysToIntake} days, visa not yet approved`,
      });
    }

    // Risk: Fee not paid & stage beyond FEE_PAID
    const stageOrder = [
      "LEAD_CONVERTED",
      "FEE_PAID",
      "CAS_I20_ISSUED",
      "VISA_FILED",
      "VISA_APPROVED",
      "TRAVEL_DONE",
    ];
    const currentStageIdx = stageOrder.indexOf(student.stage);

    if (
      student.feeStatus !== "PAID" &&
      student.totalFee > 0 &&
      !existingRiskTypes.has("FEE_OVERDUE")
    ) {
      newRisks.push({
        type: RiskType.FEE_OVERDUE,
        message: `Fee pending: ${student.feePaid}/${student.totalFee} ${student.feeCurrency}`,
      });
    }

    // Risk: CAS/I-20 not issued but stage requires it
    if (
      currentStageIdx >= 2 &&
      !student.casRef &&
      !existingRiskTypes.has("CAS_PENDING")
    ) {
      newRisks.push({
        type: RiskType.CAS_PENDING,
        message: "CAS/I-20 reference not recorded",
      });
    }

    // Risk: Visa rejected
    if (
      student.visaStatus === "REJECTED" &&
      !existingRiskTypes.has("VISA_REJECTED")
    ) {
      newRisks.push({
        type: RiskType.VISA_REJECTED,
        message: "Visa application was rejected",
      });
    }

    // Bulk create new risks
    if (newRisks.length > 0) {
      await this.prisma.enrollmentRisk.createMany({
        data: newRisks.map((r) => ({
          ...r,
          studentId,
        })),
      });
    }

    // Auto-resolve risks that no longer apply
    if (student.feeStatus === "PAID") {
      await this.prisma.enrollmentRisk.updateMany({
        where: { studentId, type: "FEE_OVERDUE", isResolved: false },
        data: { isResolved: true, resolvedAt: now },
      });
    }
    if (student.visaStatus === "APPROVED") {
      await this.prisma.enrollmentRisk.updateMany({
        where: {
          studentId,
          type: { in: ["VISA_DEADLINE", "INTAKE_APPROACHING"] },
          isResolved: false,
        },
        data: { isResolved: true, resolvedAt: now },
      });
    }
  }

  // RESOLVE A RISK MANUALLY

  async resolveRisk(riskId: string, userId?: string) {
    const risk = await this.prisma.enrollmentRisk.findUnique({
      where: { id: riskId },
    });
    if (!risk) throw new NotFoundException("Risk not found");

    const updated = await this.prisma.enrollmentRisk.update({
      where: { id: riskId },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    await this.prisma.enrollmentActivity.create({
      data: {
        type: "RISK_RESOLVED",
        message: `Risk resolved: ${risk.message}`,
        studentId: risk.studentId,
        userId,
      },
    });

    return updated;
  }

  // ADD NOTE / ACTIVITY

  async addNote(studentId: string, message: string, userId?: string) {
    const student = await this.prisma.enrolledStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException("Enrolled student not found");

    return this.prisma.enrollmentActivity.create({
      data: {
        type: "NOTE",
        message,
        studentId,
        userId,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // GET ACTIVITY TIMELINE

  async getActivities(studentId: string, limit = 50) {
    return this.prisma.enrollmentActivity.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // EXPORT DATA (for CSV download)

  async exportAll() {
    return this.prisma.enrolledStudent.findMany({
      include: {
        counselor: { select: { name: true } },
        risks: { where: { isResolved: false } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
