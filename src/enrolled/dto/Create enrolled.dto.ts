import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  LeadSource,
  EnrollmentStage,
  VisaStatus,
  FeeStatus,
} from "@prisma/client";

export class CreateEnrolledStudentDto {
  // ── Step 1: Personal Info ─────────────────────────────────────

  @ApiProperty({ example: "Arjun Mehta", description: "Student full name" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    example: "+91 9876543210",
    description: "Phone number — must be unique across enrolled students",
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: "arjun.mehta@email.com",
    description: "Student email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    enum: LeadSource,
    example: "REFERRAL",
    description: "How this student was acquired",
  })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({
    example: 7.0,
    description: "IELTS overall band score",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ieltsScore?: number;

  // ── Step 2: Academic Details ──────────────────────────────────

  @ApiProperty({ example: "UK", description: "Destination country" })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({
    example: "University of Manchester",
    description: "Target university name",
  })
  @IsString()
  @IsNotEmpty()
  university!: string;

  @ApiProperty({
    example: "MSc Data Science",
    description: "Course or program name",
  })
  @IsString()
  @IsNotEmpty()
  course!: string;

  @ApiProperty({
    example: "2025-09-01",
    description: "Intake start date (ISO 8601)",
  })
  @IsDateString()
  intakeDate!: string;

  @ApiPropertyOptional({
    example: "clxyz123counselorid",
    description: "ID of the assigned counselor (User record)",
  })
  @IsOptional()
  @IsString()
  counselorId?: string;

  // ── Step 3: Financial & Visa ──────────────────────────────────

  @ApiPropertyOptional({
    example: 25000,
    description: "Total fee amount",
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalFee?: number;

  @ApiPropertyOptional({
    example: 5000,
    description: "Amount already paid",
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  feePaid?: number;

  @ApiPropertyOptional({
    enum: FeeStatus,
    example: "PENDING",
    description:
      "Fee payment status — auto-computed from totalFee/feePaid if omitted",
  })
  @IsOptional()
  @IsEnum(FeeStatus)
  feeStatus?: FeeStatus;

  @ApiPropertyOptional({
    example: "USD",
    description: "Fee currency code",
    default: "USD",
  })
  @IsOptional()
  @IsString()
  feeCurrency?: string;

  @ApiPropertyOptional({
    enum: VisaStatus,
    example: "NOT_STARTED",
    description: "Current visa status",
    default: "NOT_STARTED",
  })
  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @ApiPropertyOptional({
    example: "2025-01-15",
    description: "Visa application submission date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  visaAppDate?: string;

  @ApiPropertyOptional({
    example: "CAS-12345678",
    description: "CAS or I-20 reference number",
  })
  @IsOptional()
  @IsString()
  casRef?: string;

  @ApiPropertyOptional({
    example: "Referred by alumni batch 2023",
    description: "Internal notes about this enrollment",
  })
  @IsOptional()
  @IsString()
  notes?: string;

  // ── Optional: link to existing lead ──────────────────────────

  @ApiPropertyOptional({
    example: "clxyz123leadid",
    description:
      "ID of the originating lead record (set automatically when using POST /from-lead/:leadId)",
  })
  @IsOptional()
  @IsString()
  leadId?: string;
}
