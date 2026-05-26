import { IsString, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum ReactivationReason {
  NEW_INFORMATION = "NEW_INFORMATION",
  FINANCIAL_RESOLVED = "FINANCIAL_RESOLVED",
  RECONNECTED = "RECONNECTED",
  ELIGIBILITY_CHANGED = "ELIGIBILITY_CHANGED",
  OTHER = "OTHER",
}

export class ReactivateLeadDto {
  @ApiProperty({ enum: ReactivationReason })
  @IsEnum(ReactivationReason)
  reason!: ReactivationReason;

  @ApiPropertyOptional({ example: "Student got scholarship" })
  @IsOptional()
  @IsString()
  notes?: string;
}
