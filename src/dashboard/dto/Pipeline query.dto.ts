import {
  IsOptional,
  IsIn,
  IsDateString,
  IsString,
  IsEnum,
} from "class-validator";
import { LeadSource } from "@prisma/client";

export class PipelineQueryDto {
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
}
