import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { IeltsService } from "./ielts.service";
import { CreateIeltsDto } from "./dto/create-ielts.dto";
import { IeltsQueryDto } from "./dto/ielts-query.dto";
import { UpdateScoresDto } from "./dto/update-ielts.dto";
import { UserRole } from "@prisma/client";

@ApiTags("IELTS")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("ielts")
export class IeltsController {
  constructor(private readonly ieltsService: IeltsService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get IELTS stats cards" })
  getStats(@Request() req: any) {
    return this.ieltsService.getStats(req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: "Get all IELTS records" })
  getAll(@Query() query: IeltsQueryDto, @Request() req: any) {
    return this.ieltsService.getAll(query, req.user.id, req.user.role);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get single IELTS record" })
  getOne(@Param("id") id: string) {
    return this.ieltsService.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create IELTS tracking record" })
  create(@Body() dto: CreateIeltsDto) {
    return this.ieltsService.create(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update IELTS record" })
  update(@Param("id") id: string, @Body() dto: CreateIeltsDto) {
    return this.ieltsService.update(id, dto);
  }

  @Patch(":id/scores")
  @ApiOperation({ summary: "Update scores and add to history" })
  updateScores(@Param("id") id: string, @Body() dto: UpdateScoresDto) {
    return this.ieltsService.updateScores(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete IELTS record — Admin only" })
  delete(@Param("id") id: string, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can delete IELTS records");
    }
    return this.ieltsService.delete(id);
  }
}
