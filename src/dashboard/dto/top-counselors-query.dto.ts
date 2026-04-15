import {
  IsOptional,
  IsIn,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { LeadSource } from "@prisma/client";

export class TopCounselorsQueryDto {
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
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
