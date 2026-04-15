import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsIn,
  IsString,
} from "class-validator";
import { LeadSource } from "@prisma/client";

export type DatePreset = "today" | "7days" | "30days" | "90days" | "custom";

export class DashboardStatsQueryDto {
  @IsOptional()
  @IsIn(["today", "7days", "30days", "90days", "custom"])
  preset?: DatePreset;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  counselorId?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;
}
