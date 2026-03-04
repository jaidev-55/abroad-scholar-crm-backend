import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from "class-validator";
import { LeadStatus, LeadSource, LeadPriority } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLeadDto {
  // student full name
  @ApiProperty({ example: "Aarav Mehta" })
  @IsString()
  fullName!: string;

  // primary contact phone number
  @ApiProperty({ example: "9876543210" })
  @IsString()
  phone!: string;

  // optional email address
  @ApiPropertyOptional({ example: "aarav@gmail.com" })
  @IsOptional()
  @IsString()
  email?: string;

  // Destination country the student is interested in
  @ApiProperty({ example: "UK" })
  @IsString()
  country!: string;

  // Source of the lead (Instagram, Website, Ads, Walk-in, etc.)
  @ApiProperty({ enum: LeadSource })
  @IsEnum(LeadSource)
  source!: LeadSource;

  // Current lead status (active, lost, etc.)
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  // Priority level of the lead
  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  // Counselor assigned to manage the lead
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counselorId?: string;

  // IELTS score of the student
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ieltsScore?: number;

  // Next follow-up date for the counselor
  @ApiPropertyOptional({ example: "2026-03-05T10:00:00Z" })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  // Reason if the lead is marked as lost
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostReason?: string;
}
