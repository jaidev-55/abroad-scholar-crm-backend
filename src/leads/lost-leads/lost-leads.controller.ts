import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { LostLeadService } from "./lost-leads.service";
import { LostLeadsQueryDto } from "./dto/lost-leads-query.dto";
import { ReactivateLeadDto } from "./dto/reactivate-lead.dto";

@ApiTags("Lost Leads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("lost-leads")
export class LostLeadsController {
  constructor(private readonly lostLeadService: LostLeadService) {}

  @Get("stats")
  @ApiOperation({
    summary: "Get lost leads stats (totals, recovery rate, top reasons)",
  })
  getStats(@Request() req: any) {
    return this.lostLeadService.getLostLeadsStatus(req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: "Get all lost leads with filters & pagination" })
  getLostLeads(@Query() query: LostLeadsQueryDto, @Request() req: any) {
    return this.lostLeadService.getLostLeads(query, req.user.id, req.user.role);
  }

  @Post(":id/reactivate")
  @ApiOperation({ summary: "Reactivate a lost lead back to pipeline" })
  reactivate(
    @Param("id") id: string,
    @Body() dto: ReactivateLeadDto,
    @Request() req: any,
  ) {
    return this.lostLeadService.reactivateLead(
      id,
      dto,
      req.user.id,
      req.user.role,
    );
  }
}
