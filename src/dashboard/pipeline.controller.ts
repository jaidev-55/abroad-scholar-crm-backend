import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PipelineQueryDto } from "./dto/Pipeline query.dto";
import { PipelineService } from "./pipeline.service";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get("pipeline")
  @ApiOperation({
    summary: "Get pipeline funnel breakdown",
    description:
      "Returns lead counts per stage (New, In Progress, Converted, Lost) with conversion rate. Powers the Pipeline Funnel bars.",
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
  @ApiResponse({
    status: 200,
    description: "Pipeline funnel returned successfully",
    schema: {
      example: {
        period: {
          preset: "30days",
          from: "2026-03-14T00:00:00.000Z",
          to: "2026-04-13T23:59:59.999Z",
        },
        total: 6,
        conversionRate: 20,
        stages: [
          {
            status: "NEW",
            label: "New",
            count: 2,
            percentage: 33,
            color: "#3B82F6",
          },
          {
            status: "IN_PROGRESS",
            label: "In Progress",
            count: 2,
            percentage: 33,
            color: "#8B5CF6",
          },
          {
            status: "CONVERTED",
            label: "Converted",
            count: 1,
            percentage: 17,
            color: "#22C55E",
          },
          {
            status: "LOST",
            label: "Lost",
            count: 1,
            percentage: 17,
            color: "#94A3B8",
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
  getPipeline(@Query() query: PipelineQueryDto) {
    return this.pipelineService.getPipeline(query);
  }
}
