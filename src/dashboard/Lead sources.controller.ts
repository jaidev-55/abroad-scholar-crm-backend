import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LeadSourcesService } from "./Lead sources.service";
import { LeadSourcesQueryDto } from "./dto/lead-sources-query.dto";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class LeadSourcesController {
  constructor(private readonly leadSourcesService: LeadSourcesService) {}

  @Get("lead-sources")
  @ApiOperation({
    summary: "Get lead sources breakdown",
    description:
      "Returns lead count and percentage per source. Powers the Lead Sources donut chart.",
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
  @ApiResponse({
    status: 200,
    description: "Lead sources returned successfully",
    schema: {
      example: {
        period: {
          preset: "30days",
          from: "2026-03-14T00:00:00.000Z",
          to: "2026-04-13T23:59:59.999Z",
        },
        total: 6,
        sources: [
          { source: "WEBSITE", count: 2, percentage: 33, color: "#22C55E" },
          { source: "INSTAGRAM", count: 2, percentage: 33, color: "#E91E8C" },
          { source: "FACEBOOK", count: 1, percentage: 17, color: "#3B82F6" },
          { source: "REFERRAL", count: 1, percentage: 17, color: "#F59E0B" },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "from and to required when preset=custom",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getSources(@Query() query: LeadSourcesQueryDto) {
    return this.leadSourcesService.getSources(query);
  }
}
