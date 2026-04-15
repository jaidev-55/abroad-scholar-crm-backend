import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DashboardService, LeadsTrendService } from "./dashboard.service";
import { DashboardStatsQueryDto } from "./dto/dashboard-stats-query.dto";
import { LeadsTrendQueryDto } from "./dto/Leads trend query.dto";

// Dashboard Stats
@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @ApiOperation({
    summary: "Get dashboard overview stats",
    description:
      "Returns total leads, hot leads, follow-ups due, converted and lost — each with % change vs the previous period.",
  })
  @ApiQuery({
    name: "preset",
    required: false,
    enum: ["today", "7days", "30days", "90days", "custom"],
    description: "Date preset (default: today)",
  })
  @ApiQuery({
    name: "from",
    required: false,
    example: "2026-04-01",
    description: "Start date — required when preset=custom",
  })
  @ApiQuery({
    name: "to",
    required: false,
    example: "2026-04-30",
    description: "End date — required when preset=custom",
  })
  @ApiQuery({
    name: "counselorId",
    required: false,
    description: "Filter by counselor UUID",
  })
  @ApiQuery({
    name: "source",
    required: false,
    enum: [
      "INSTAGRAM",
      "WEBSITE",
      "WALK_IN",
      "GOOGLE_ADS",
      "META_ADS",
      "REFERRAL",
      "GOOGLE_SHEET",
    ],
    description: "Filter by lead source",
  })
  @ApiResponse({
    status: 200,
    description: "Stats returned successfully",
    schema: {
      example: {
        period: {
          preset: "custom",
          from: "2026-04-13T00:00:00.000Z",
          to: "2026-05-10T23:59:59.999Z",
        },
        stats: {
          totalLeads: { value: 6, change: 12 },
          hotLeads: { value: 3, change: 8 },
          followUpsDue: { value: 2, change: -5 },
          converted: { value: 1, change: 18 },
          lostLeads: { value: 1, change: -3 },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "from and to required when preset=custom",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getStats(@Query() query: DashboardStatsQueryDto) {
    return this.dashboardService.getStats(query);
  }
}

//  Leads Trend
@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class LeadsTrendController {
  constructor(private readonly leadsTrendService: LeadsTrendService) {}

  @Get("leads-trend")
  @ApiOperation({
    summary: "Get leads trend over time",
    description:
      "Returns new leads vs converted counts grouped by day or week. Powers the Leads Trend line chart.",
  })
  @ApiQuery({
    name: "preset",
    required: false,
    enum: ["today", "7days", "30days", "90days", "custom"],
    description: "Date preset (default: 7days)",
  })
  @ApiQuery({
    name: "from",
    required: false,
    example: "2026-04-01",
    description: "Start date — required when preset=custom",
  })
  @ApiQuery({
    name: "to",
    required: false,
    example: "2026-04-30",
    description: "End date — required when preset=custom",
  })
  @ApiQuery({
    name: "groupBy",
    required: false,
    enum: ["day", "week"],
    description: "Bucket size (default: day)",
  })
  @ApiQuery({
    name: "counselorId",
    required: false,
    description: "Filter by counselor UUID",
  })
  @ApiQuery({
    name: "source",
    required: false,
    enum: [
      "INSTAGRAM",
      "WEBSITE",
      "WALK_IN",
      "GOOGLE_ADS",
      "META_ADS",
      "REFERRAL",
      "GOOGLE_SHEET",
    ],
    description: "Filter by lead source",
  })
  @ApiResponse({
    status: 200,
    description: "Trend data returned successfully",
    schema: {
      example: {
        period: {
          preset: "7days",
          from: "2026-04-07T00:00:00.000Z",
          to: "2026-04-13T23:59:59.999Z",
          groupBy: "day",
        },
        data: [
          { date: "2026-04-07", newLeads: 10, converted: 5 },
          { date: "2026-04-08", newLeads: 13, converted: 6 },
          { date: "2026-04-09", newLeads: 11, converted: 4 },
          { date: "2026-04-10", newLeads: 18, converted: 8 },
          { date: "2026-04-11", newLeads: 20, converted: 10 },
          { date: "2026-04-12", newLeads: 24, converted: 11 },
          { date: "2026-04-13", newLeads: 28, converted: 12 },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "from and to required when preset=custom",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getTrend(@Query() query: LeadsTrendQueryDto) {
    return this.leadsTrendService.getTrend(query);
  }
}
