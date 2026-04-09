import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
  ParseEnumPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Req } from "@nestjs/common";
import { Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { CreateNoteDto } from "./dto/create-note.dto";
import { CreateCallLogDto } from "./dto/create-call-log.dto";
import { MarkLostDto } from "./dto/mark-lost.dto";
import { ActivityType } from "@prisma/client";
import { SendTemplateEmailDto } from "./dto/send-template-email.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { SendCustomEmailDto } from "./dto/send-custom-email.dto";
import { DeleteMultipleLeadsDto } from "./dto/delete-multiple.dto";

@ApiTags("Leads")
@ApiBearerAuth()
@Controller("leads")
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Get dashboard statistics
  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics" })
  @ApiResponse({ status: 200, description: "Stats fetched successfully" })
  getStats() {
    return this.leadsService.getStats();
  }
  // Create a new lead
  @ApiOperation({ summary: "Create new lead" })
  @ApiResponse({ status: 201, description: "Lead created successfully" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "COUNSELOR")
  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.leadsService.create(dto, req.user);
  }

  // Add note to a lead
  @ApiOperation({ summary: "Add note to lead" })
  @Post(":id/notes")
  addNote(@Param("id") id: string, @Body() dto: CreateNoteDto) {
    return this.leadsService.addNote(id, dto);
  }

  // Fetch all leads with optional filters
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get all leads list" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "source", required: false })
  @ApiQuery({ name: "counselorId", required: false })
  @ApiQuery({ name: "country", required: false })
  @ApiQuery({ name: "priority", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "lostReason", required: false })
  @ApiQuery({ name: "followUpFrom", required: false })
  @ApiQuery({ name: "followUpTo", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get()
  findAll(
    @Query("search") search?: string,
    @Query("source") source?: string,
    @Query("counselorId") counselorId?: string,
    @Query("country") country?: string,
    @Query("priority") priority?: string,
    @Query("status") status?: string,
    @Query("lostReason") lostReason?: string,
    @Query("followUpFrom") followUpFrom?: string,
    @Query("followUpTo") followUpTo?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Req() req?: Request,
  ) {
    return this.leadsService.findAll(
      {
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
      },
      req?.user,
    );
  }

  // Get single lead by ID
  @ApiOperation({ summary: "Get single lead" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.leadsService.findOne(id);
  }

  // Update lead details or status
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update entire lead details" })
  @ApiParam({ name: "id", description: "Lead ID" })
  updateLead(
    @Param("id") id: string,
    @Body() dto: UpdateLeadDto,
    @Req() req: Request,
  ) {
    return this.leadsService.updateLead(id, dto, req.user);
  }

  // Get activity timeline for a lead
  @Get(":id/activity")
  @ApiOperation({ summary: "Get lead activity timeline" })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "search", required: false })
  getActivity(
    @Param("id") id: string,
    @Query("type", new ParseEnumPipe(ActivityType, { optional: true }))
    type?: ActivityType,
    @Query("search") search?: string,
  ) {
    return this.leadsService.getActivity(id, type, search);
  }

  // Mark lead as LOST
  @Post(":id/mark-lost")
  @ApiOperation({ summary: "Mark lead as lost (requires reason)" })
  markAsLost(@Param("id") id: string, @Body() dto: MarkLostDto) {
    return this.leadsService.markAsLost(id, dto);
  }

  // Log a call activity manually
  @Post(":id/call")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Log call activity" })
  logCall(
    @Param("id") id: string,
    @Body() dto: CreateCallLogDto,
    @Req() req: Request,
  ) {
    return this.leadsService.logCall(id, dto, req.user);
  }

  // GET /leads/:id/call-logs → call history + summary stats
  @Get(":id/call-logs")
  @ApiOperation({ summary: "Get call log history for a lead" })
  getCallLogs(@Param("id") id: string) {
    return this.leadsService.getCallLogs(id);
  }

  // POST /leads/:id/send-template-email → send email to lead using a saved template
  @Post(":id/send-template-email")
  @ApiOperation({ summary: "Send email using template" })
  sendTemplateEmail(
    @Param("id") leadId: string,
    @Body() dto: SendTemplateEmailDto,
  ) {
    return this.leadsService.sendTemplateEmail(leadId, dto.templateId);
  }

  // POST /leads/:id/send-email
  @Post(":id/send-email")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("attachment", {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
          cb(new BadRequestException("Only PDF files are allowed"), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Send custom email to lead" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["subject", "message"],
      properties: {
        subject: { type: "string", example: "Follow-up on your application" },
        message: { type: "string", example: "Hi John, just checking in..." },
        attachment: {
          type: "string",
          format: "binary",
          description: "PDF only, max 10MB",
        },
      },
    },
  })
  async sendCustomEmail(
    @Param("id") id: string,
    @Body() dto: SendCustomEmailDto,
    @Req() req: Request,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.leadsService.sendCustomEmail(id, dto, req.user, attachment);
  }

  // Delete single lead
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete a single lead" })
  @ApiParam({ name: "id", description: "Lead ID" })
  deleteLead(@Param("id") id: string) {
    return this.leadsService.deleteLead(id);
  }
  // Delete multiple Leads
  @Post("bulk-delete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete multiple leads by IDs" })
  deleteMultiple(@Body() dto: DeleteMultipleLeadsDto) {
    return this.leadsService.deleteMultiple(dto.ids);
  }
}
