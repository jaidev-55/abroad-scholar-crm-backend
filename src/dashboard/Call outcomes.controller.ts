import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CallOutcomesService } from "./call-outcomes.service";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard/call-outcomes")
export class CallOutcomesController {
  constructor(private readonly service: CallOutcomesService) {}

  @Get()
  @ApiOperation({ summary: "Get call outcome breakdown for the dashboard" })
  @ApiQuery({ name: "preset", required: false, example: "30days" })
  @ApiQuery({ name: "from", required: false, example: "2026-01-01" })
  @ApiQuery({ name: "to", required: false, example: "2026-04-25" })
  @ApiQuery({ name: "counselorId", required: false })
  @ApiQuery({ name: "source", required: false })
  async getCallOutcomes(
    @Query("preset") preset?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("counselorId") counselorId?: string,
    @Query("source") source?: string,
  ) {
    return this.service.getCallOutcomes({
      preset,
      from,
      to,
      counselorId,
      source,
    });
  }
}
