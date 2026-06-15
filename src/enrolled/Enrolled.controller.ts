import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FileValidationPipe } from "../common/file-validation.pipe";
import { EnrolledService } from "./Enrolled.service";
import { EnrollmentStage } from "@prisma/client";
import { CreateEnrolledStudentDto } from "./dto/Create enrolled.dto";
import { EnrolledQueryDto } from "./dto/Enrolled query.dto";
import { UpdateEnrolledStudentDto } from "./dto/Update enrolled.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  CreateCommissionDto,
  RecordCommissionPaymentDto,
  UpdateCommissionDto,
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

@Controller("enrolled")
@UseGuards(JwtAuthGuard)
export class EnrolledController {
  constructor(private readonly enrolledService: EnrolledService) {}

  // ── STATS ─────────────────────────────────────────────────────
  @Get("stats")
  getStats() {
    return this.enrolledService.getStats();
  }

  // ── FILTER OPTIONS ────────────────────────────────────────────
  @Get("filters")
  getFilterOptions() {
    return this.enrolledService.getFilterOptions();
  }

  // ── EXPORT ────────────────────────────────────────────────────
  @Get("export")
  exportAll() {
    return this.enrolledService.exportAll();
  }

  // ── LIST ALL ──────────────────────────────────────────────────
  @Get()
  findAll(@Query() query: EnrolledQueryDto) {
    return this.enrolledService.findAll(query);
  }

  // ── CREATE ───────────────────────

  @Post()
  create(@Body() dto: CreateEnrolledStudentDto, @Req() req: any) {
    return this.enrolledService.create(dto, req.user?.id);
  }

  // ── ENROLL FROM LEAD ──────────────────────────────────────────
  @Post("from-lead/:leadId")
  enrollFromLead(
    @Param("leadId") leadId: string,
    @Body() dto: Partial<CreateEnrolledStudentDto>,
    @Req() req: any,
  ) {
    return this.enrolledService.enrollFromLead(leadId, dto, req.user?.id);
  }

  // ── GET SINGLE STUDENT ────────────────────────────────────────
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.enrolledService.findOne(id);
  }

  // ── UPDATE STUDENT ────────────────────────────────────────────
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEnrolledStudentDto,
    @Req() req: any,
  ) {
    return this.enrolledService.update(id, dto, req.user?.id);
  }

  // ── UPDATE STAGE ──────────────────────────────────────────────
  @Patch(":id/stage")
  updateStage(
    @Param("id") id: string,
    @Body("stage") stage: EnrollmentStage,
    @Body("note") note: string,
    @Req() req: any,
  ) {
    return this.enrolledService.updateStage(id, stage, req.user?.id, note);
  }

  // ── ADD NOTE ──────────────────────────────────────────────────
  @Post(":id/notes")
  addNote(
    @Param("id") id: string,
    @Body("message") message: string,
    @Req() req: any,
  ) {
    return this.enrolledService.addNote(id, message, req.user?.id);
  }

  // ── ACTIVITY TIMELINE ─────────────────────────────────────────
  @Get(":id/activities")
  getActivities(@Param("id") id: string, @Query("limit") limit?: number) {
    return this.enrolledService.getActivities(id, limit ? +limit : 50);
  }

  // ── RESOLVE RISK ──────────────────────────────────────────────
  @Patch("risks/:riskId/resolve")
  resolveRisk(@Param("riskId") riskId: string, @Req() req: any) {
    return this.enrolledService.resolveRisk(riskId, req.user?.id);
  }

  // ── DELETE STUDENT ────────────────────────────────────────────
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.enrolledService.remove(id);
  }

  // ── VISA ──────────────────────────────────────────────────────
  @Get(":id/visa")
  getVisaDetail(@Param("id") id: string) {
    return this.enrolledService.getVisaDetail(id);
  }

  @Put(":id/visa")
  upsertVisaDetail(
    @Param("id") id: string,
    @Body() dto: UpdateVisaDetailDto,
    @Req() req: any,
  ) {
    return this.enrolledService.upsertVisaDetail(id, dto, req.user?.id);
  }

  // ── FEE PAYMENTS ──────────────────────────────────────────────
  @Get(":id/fees")
  getFeePayments(@Param("id") id: string) {
    return this.enrolledService.getFeePayments(id);
  }

  @Post(":id/fees")
  createFeePayment(
    @Param("id") id: string,
    @Body() dto: CreateFeePaymentDto,
    @Req() req: any,
  ) {
    return this.enrolledService.createFeePayment(id, dto, req.user?.id);
  }

  @Put(":id/fees/:feeId")
  updateFeePayment(
    @Param("id") id: string,
    @Param("feeId") feeId: string,
    @Body() dto: UpdateFeePaymentDto,
    @Req() req: any,
  ) {
    return this.enrolledService.updateFeePayment(id, feeId, dto, req.user?.id);
  }

  @Delete(":id/fees/:feeId")
  deleteFeePayment(@Param("id") id: string, @Param("feeId") feeId: string) {
    return this.enrolledService.deleteFeePayment(id, feeId);
  }

  // ── DOCUMENTS ─────────────────────────────────────────────────
  @Get(":id/documents")
  getDocuments(@Param("id") id: string) {
    return this.enrolledService.getDocuments(id);
  }

  @Post(":id/documents")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  createDocument(
    @Param("id") id: string,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Body("name") name: string,
    @Body("expiryDate") expiryDate: string,
    @Body("notes") notes: string,
    @Req() req: any,
  ) {
    return this.enrolledService.createDocumentWithFile(
      id,
      file,
      name,
      expiryDate,
      notes,
      req.user?.id,
    );
  }
  @Put(":id/documents/:docId")
  updateDocument(
    @Param("docId") docId: string,
    @Body() dto: UpdateDocumentDto,
    @Req() req: any,
  ) {
    return this.enrolledService.updateDocument(
      docId,
      dto,
      undefined,
      req.user?.id,
    );
  }

  @Delete(":id/documents/:docId")
  deleteDocument(@Param("docId") docId: string, @Req() req: any) {
    return this.enrolledService.deleteDocument(docId, req.user?.id);
  }

  // ── PRE-DEPARTURE ─────────────────────────────────────────────
  @Get(":id/pre-departure")
  getPreDeparture(@Param("id") id: string) {
    return this.enrolledService.getPreDeparture(id);
  }

  @Post(":id/pre-departure")
  createPreDepartureItem(
    @Param("id") id: string,
    @Body() dto: CreatePreDepartureDto,
    @Req() req: any,
  ) {
    return this.enrolledService.createPreDepartureItem(id, dto, req.user?.id);
  }

  @Patch(":id/pre-departure/:itemId")
  updatePreDepartureItem(
    @Param("itemId") itemId: string,
    @Body() dto: UpdatePreDepartureDto,
  ) {
    return this.enrolledService.updatePreDepartureItem(itemId, dto);
  }

  @Patch(":id/pre-departure/:itemId/toggle")
  togglePreDepartureItem(@Param("itemId") itemId: string) {
    return this.enrolledService.togglePreDepartureItem(itemId);
  }

  @Delete(":id/pre-departure/:itemId")
  deletePreDepartureItem(@Param("itemId") itemId: string) {
    return this.enrolledService.deletePreDepartureItem(itemId);
  }

  // ── COMMISSION ────────────────────────────────────────────────
  @Get(":id/commission")
  getCommission(@Param("id") id: string) {
    return this.enrolledService.getCommission(id);
  }

  @Post(":id/commission")
  createCommission(
    @Param("id") id: string,
    @Body() dto: CreateCommissionDto,
    @Req() req: any,
  ) {
    return this.enrolledService.createCommission(id, dto, req.user?.id);
  }

  @Put(":id/commission")
  updateCommission(@Param("id") id: string, @Body() dto: UpdateCommissionDto) {
    return this.enrolledService.updateCommission(id, dto);
  }

  @Post(":id/commission/payment")
  recordCommissionPayment(
    @Param("id") id: string,
    @Body() dto: RecordCommissionPaymentDto,
    @Req() req: any,
  ) {
    return this.enrolledService.recordCommissionPayment(id, dto, req.user?.id);
  }
}
