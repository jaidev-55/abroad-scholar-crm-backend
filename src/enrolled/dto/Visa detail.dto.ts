import { VisaStatus, VisaType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateVisaDetailDto {
  @ApiPropertyOptional({
    example: "P1234567",
    description: "Passport number",
  })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({
    example: "2030-06-15",
    description:
      "Passport expiry date (ISO 8601) — triggers a risk alert if within 12 months of intake",
  })
  @IsOptional()
  @IsDateString()
  passportExpiry?: string;

  @ApiPropertyOptional({
    enum: VisaType,
    example: "TIER_4",
    description:
      "Visa type (e.g. TIER_4 for UK, F1 for USA, STUDY_PERMIT for Canada)",
  })
  @IsOptional()
  @IsEnum(VisaType)
  visaType?: VisaType;

  @ApiPropertyOptional({
    enum: VisaStatus,
    example: "IN_PROGRESS",
    description:
      "Current visa processing status — also updates the parent enrolled student record",
  })
  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @ApiPropertyOptional({
    example: "2025-02-10",
    description: "Date the visa application was filed (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  filingDate?: string;

  @ApiPropertyOptional({
    example: "2025-03-05",
    description: "Date biometrics were completed (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  biometricDate?: string;

  @ApiPropertyOptional({
    example: "2025-04-12",
    description: "Date of visa interview (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @ApiPropertyOptional({
    example: "2025-05-20",
    description: "Date the visa decision was received (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  decisionDate?: string;

  @IsOptional()
  @IsString()
  casRef?: string;
}
