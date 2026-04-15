import { IsOptional, IsIn, IsDateString, IsString } from "class-validator";

export class LeadSourcesQueryDto {
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
}
