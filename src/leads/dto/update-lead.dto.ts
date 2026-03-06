import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsEmail,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { LeadStatus, LeadSource, LeadPriority } from "@prisma/client";

export class UpdateLeadDto {
  // Update lead full name
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  fullName?: string;

  // Update phone number
  @ApiPropertyOptional({ example: "+919876543210" })
  @IsOptional()
  @IsString()
  phone?: string;

  // Update email address
  @ApiPropertyOptional({ example: "student@email.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Update target country
  @ApiPropertyOptional({ example: "Canada" })
  @IsOptional()
  @IsString()
  country?: string;

  // Update lead status
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  // Update lead source
  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  // Update lead priority
  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  // Assign or change counselor (ADMIN only - enforced in service RBAC)
  @ApiPropertyOptional({
    description: "Admin only: assign or change counselor",
  })
  @IsOptional()
  @IsString()
  counselorId?: string;

  // Update follow-up date
  @ApiPropertyOptional({
    example: "2026-03-20T10:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  // Required when marking lead as LOST
  @ApiPropertyOptional({
    example: "Student chose another consultant",
  })
  @IsOptional()
  @IsString()
  lostReason?: string;
}
