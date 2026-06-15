import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  LeadSource,
  EnrollmentStage,
  VisaStatus,
  FeeStatus,
} from "@prisma/client";

export class UpdateEnrolledStudentDto {
  // ── Personal Info ─────────────────────────────────────────────

  @ApiPropertyOptional({
    example: "Arjun Mehta",
    description: "Updated full name",
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: "+91 9876543210",
    description: "Updated phone number (must remain unique)",
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: "arjun.mehta@email.com",
    description: "Updated email address",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    enum: LeadSource,
    example: "REFERRAL",
    description: "How the student was acquired",
  })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({
    example: 7.5,
    description: "Updated IELTS overall band score",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ieltsScore?: number;

  // ── Academic Details ──────────────────────────────────────────

  @ApiPropertyOptional({
    example: "Canada",
    description: "Updated destination country",
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: "University of Toronto",
    description: "Updated university name",
  })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({
    example: "MBA Finance",
    description: "Updated course or program name",
  })
  @IsOptional()
  @IsString()
  course?: string;

  @ApiPropertyOptional({
    example: "2026-01-06",
    description: "Updated intake date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  intakeDate?: string;

  @ApiPropertyOptional({
    example: "clxyz123counselorid",
    description: "Updated assigned counselor ID",
  })
  @IsOptional()
  @IsString()
  counselorId?: string;

  // ── Stage & Visa ──────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: EnrollmentStage,
    example: "VISA_FILED",
    description:
      "Updated pipeline stage — prefer PATCH /:id/stage for stage-only changes",
  })
  @IsOptional()
  @IsEnum(EnrollmentStage)
  stage?: EnrollmentStage;

  @ApiPropertyOptional({
    enum: VisaStatus,
    example: "IN_PROGRESS",
    description: "Updated visa status",
  })
  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @ApiPropertyOptional({
    example: "2025-03-10",
    description: "Visa application submission date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  visaAppDate?: string;

  @ApiPropertyOptional({
    example: "2025-05-20",
    description: "Visa decision date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  visaDecDate?: string;

  @ApiPropertyOptional({
    example: "CAS-87654321",
    description: "CAS or I-20 reference number",
  })
  @IsOptional()
  @IsString()
  casRef?: string;

  // ── Financial ─────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 30000,
    description: "Updated total fee amount (>= 0)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalFee?: number;

  @ApiPropertyOptional({
    example: 15000,
    description: "Updated amount paid so far (>= 0)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  feePaid?: number;

  @ApiPropertyOptional({
    enum: FeeStatus,
    example: "PARTIAL",
    description: "Override the computed fee status",
  })
  @IsOptional()
  @IsEnum(FeeStatus)
  feeStatus?: FeeStatus;

  @ApiPropertyOptional({
    example: "GBP",
    description: "Updated fee currency code",
  })
  @IsOptional()
  @IsString()
  feeCurrency?: string;

  // ── Travel ────────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: "2025-09-05",
    description: "Confirmed travel / departure date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  travelDate?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the student is fully ready to travel",
  })
  @IsOptional()
  @IsBoolean()
  travelReady?: boolean;

  @ApiPropertyOptional({
    example: "Student requested deferral to Jan intake",
    description: "Updated internal notes",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
