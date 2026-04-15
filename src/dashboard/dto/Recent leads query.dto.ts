import {
  IsOptional,
  IsIn,
  IsDateString,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { LeadSource, LeadStatus, LeadPriority } from "@prisma/client";

export class RecentLeadsQueryDto {
  @IsOptional()
  @IsIn(["today", "7days", "30days", "90days", "custom"])
  preset?: "today" | "7days" | "30days" | "90days" | "custom";

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

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
