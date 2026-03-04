import { IsOptional, IsString, IsEnum, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { LeadStatus, LeadSource, LeadPriority } from "@prisma/client";

export class UpdateLeadDto {
  // Update lead full name
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  // Update phone number
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  // Update email address
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  // Update target country
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  // Update lead status (NEW, IN_PROGRESS, CONVERTED, LOST)
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  // Update lead source (INSTAGRAM, WEBSITE, etc.)
  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  // Update priority level (HOT, WARM, COLD)
  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  // Assign or change counselor
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counselorId?: string;

  // Update follow-up date
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  // Required when marking lead as LOST
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lostReason?: string;
}
