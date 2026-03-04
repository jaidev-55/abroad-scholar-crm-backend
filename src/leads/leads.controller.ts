import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
  ParseEnumPipe,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { CreateNoteDto } from "./dto/create-note.dto";
import { CreateCallLogDto } from "./dto/create-call-log.dto";
import { MarkLostDto } from "./dto/mark-lost.dto";
import { ActivityType } from "@prisma/client";

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
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // Add note to a lead
  @ApiOperation({ summary: "Add note to lead" })
  @Post(":id/notes")
  addNote(@Param("id") id: string, @Body() dto: CreateNoteDto) {
    return this.leadsService.addNote(id, dto);
  }

  // Fetch all leads with optional filters
  @ApiOperation({ summary: "Get all leads list" })
  @Get()
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "stage", required: false })
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
  findAll(
    @Query("search") search?: string,
    @Query("stage") stage?: string,
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
  ) {
    return this.leadsService.findAll({
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
    });
  }

  // Get single lead by ID
  @ApiOperation({ summary: "Get single lead" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.leadsService.findOne(id);
  }

  // Update lead details or status
  @Patch(":id")
  @ApiOperation({ summary: "Update entire lead details" })
  @ApiParam({ name: "id", description: "Lead ID" })
  updateLead(@Param("id") id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.updateLead(id, dto);
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
  @ApiOperation({ summary: "Mark lead as lost" })
  markAsLost(@Param("id") id: string, @Body() dto: MarkLostDto) {
    return this.leadsService.markAsLost(id, dto);
  }

  // Log a call activity manually
  @Post(":id/call")
  @ApiOperation({ summary: "Log call activity" })
  logCall(@Param("id") id: string, @Body() dto: CreateCallLogDto) {
    return this.leadsService.logCall(id, dto);
  }
}
