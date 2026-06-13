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
import {
  LeadSource,
  EnrollmentStage,
  VisaStatus,
  FeeStatus,
} from "@prisma/client";

export class UpdateEnrolledStudentDto {
  // Personal Info
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ieltsScore?: number;

  // Academic Details
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsDateString()
  intakeDate?: string;

  @IsOptional()
  @IsString()
  counselorId?: string;

  // Stage & Visa
  @IsOptional()
  @IsEnum(EnrollmentStage)
  stage?: EnrollmentStage;

  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @IsOptional()
  @IsDateString()
  visaAppDate?: string;

  @IsOptional()
  @IsDateString()
  visaDecDate?: string;

  @IsOptional()
  @IsString()
  casRef?: string;

  // Financial
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalFee?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  feePaid?: number;

  @IsOptional()
  @IsEnum(FeeStatus)
  feeStatus?: FeeStatus;

  @IsOptional()
  @IsString()
  feeCurrency?: string;

  // Travel
  @IsOptional()
  @IsDateString()
  travelDate?: string;

  @IsOptional()
  @IsBoolean()
  travelReady?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
