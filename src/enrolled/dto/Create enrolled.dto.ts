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
import {
  LeadSource,
  EnrollmentStage,
  VisaStatus,
  FeeStatus,
} from "@prisma/client";

export class CreateEnrolledStudentDto {
  // Step 1: Personal Info
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ieltsScore?: number;

  // Step 2: Academic Details
  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  university!: string;

  @IsString()
  @IsNotEmpty()
  course!: string;

  @IsDateString()
  intakeDate!: string;

  @IsOptional()
  @IsString()
  counselorId?: string;

  // Step 3: Financial & Visa
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

  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @IsOptional()
  @IsDateString()
  visaAppDate?: string;

  @IsOptional()
  @IsString()
  casRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Optional: link to existing lead
  @IsOptional()
  @IsString()
  leadId?: string;
}
