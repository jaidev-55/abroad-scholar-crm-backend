import { LeadSource } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from "class-validator";

export class LeadsTrendQueryDto {
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
  @IsIn(["day", "week"])
  groupBy?: "day" | "week";

  @IsOptional()
  @IsString()
  counselorId?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;
}
