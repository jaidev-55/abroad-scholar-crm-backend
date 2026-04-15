import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TopCounselorsQueryDto } from "./dto/top-counselors-query.dto";
import { TopCounselorsService } from "./top-counselors.service";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class TopCounselorsController {
  constructor(private readonly topCounselorsService: TopCounselorsService) {}

  @Get("top-counselors")
  @ApiOperation({
    summary: "Get top counselors leaderboard",
    description:
      "Returns counselors ranked by conversion rate with total leads, converted count and initials for avatar. Powers the Top Counselors leaderboard card.",
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
    name: "limit",
    required: false,
    example: 5,
    description: "Number of counselors to return (default: 5, max: 20)",
  })
  @ApiResponse({
    status: 200,
    description: "Top counselors returned successfully",
    schema: {
      example: {
        period: {
          preset: "30days",
          from: "2026-03-14T00:00:00.000Z",
          to: "2026-04-13T23:59:59.999Z",
        },
        counselors: [
          {
            id: "uuid-1",
            name: "Ganesh",
            email: "ganesh@example.com",
            initials: "G",
            totalLeads: 42,
            converted: 18,
            conversionRate: 43,
          },
          {
            id: "uuid-2",
            name: "Meera",
            email: "meera@example.com",
            initials: "M",
            totalLeads: 38,
            converted: 15,
            conversionRate: 39,
          },
          {
            id: "uuid-3",
            name: "Arjun",
            email: "arjun@example.com",
            initials: "A",
            totalLeads: 31,
            converted: 11,
            conversionRate: 35,
          },
          {
            id: "uuid-4",
            name: "Divya",
            email: "divya@example.com",
            initials: "D",
            totalLeads: 24,
            converted: 7,
            conversionRate: 29,
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
  getTopCounselors(@Query() query: TopCounselorsQueryDto) {
    return this.topCounselorsService.getTopCounselors(query);
  }
}
