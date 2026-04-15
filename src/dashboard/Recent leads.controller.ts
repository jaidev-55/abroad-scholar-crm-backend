import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RecentLeadsService } from "./Recent leads.service";
import { RecentLeadsQueryDto } from "./dto/Recent leads query.dto";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class RecentLeadsController {
  constructor(private readonly recentLeadsService: RecentLeadsService) {}

  @Get("recent-leads")
  @ApiOperation({
    summary: "Get recent leads table",
    description:
      "Returns paginated leads sorted by newest first. Supports filtering by counselor, source, status, priority and full-text search. Powers the Recent Leads table on the dashboard.",
  })
  @ApiQuery({
    name: "preset",
    required: false,
    enum: ["today", "7days", "30days", "90days", "custom"],
    description: "Date preset (default: 30days)",
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
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["NEW", "IN_PROGRESS", "CONVERTED", "LOST"],
    description: "Filter by lead status",
  })
  @ApiQuery({
    name: "priority",
    required: false,
    enum: ["HOT", "WARM", "COLD"],
    description: "Filter by priority",
  })
  @ApiQuery({
    name: "search",
    required: false,
    example: "Priya",
    description: "Search by name, phone or email",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    example: 6,
    description: "Rows per page (default: 6, max: 100)",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    example: 0,
    description: "Pagination offset (default: 0)",
  })
  @ApiResponse({
    status: 200,
    description: "Recent leads returned successfully",
    schema: {
      example: {
        period: {
          preset: "30days",
          from: "2026-03-14T00:00:00.000Z",
          to: "2026-04-13T23:59:59.999Z",
        },
        meta: { total: 6, limit: 6, offset: 0, hasMore: false },
        data: [
          {
            id: "uuid-1",
            fullName: "Abroad Scholar",
            initials: "AS",
            phone: "+91 9876543210",
            email: "abroad@example.com",
            country: "Canada",
            ieltsScore: 9,
            source: "INSTAGRAM",
            priority: "HOT",
            status: "NEW",
            followUpDate: null,
            createdAt: "2026-04-11T00:00:00.000Z",
            counselor: { id: "uuid-c1", name: "Ganesh" },
          },
          {
            id: "uuid-2",
            fullName: "Priya Sharma",
            initials: "PS",
            phone: "+91 9876543211",
            email: "priya@example.com",
            country: "Australia",
            ieltsScore: 8,
            source: "FACEBOOK",
            priority: "HOT",
            status: "IN_PROGRESS",
            followUpDate: "2026-04-14T00:00:00.000Z",
            createdAt: "2026-04-10T00:00:00.000Z",
            counselor: { id: "uuid-c1", name: "Ganesh" },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "from and to required when preset=custom",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getRecentLeads(@Query() query: RecentLeadsQueryDto) {
    return this.recentLeadsService.getRecentLeads(query);
  }
}
