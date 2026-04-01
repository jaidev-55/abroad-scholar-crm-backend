import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsEmail,
  IsArray,
  IsNumber,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  LeadStatus,
  LeadSource,
  LeadPriority,
  LostReason,
} from "@prisma/client";

class UpdateNoteDto {
  @ApiPropertyOptional({ example: "note-id-123" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: "Interested in UK universities" })
  @IsString()
  content!: string;
}

export class UpdateLeadDto {
  // Full name
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  fullName?: string;

  // Phone
  @ApiPropertyOptional({ example: "+919876543210" })
  @IsOptional()
  @IsString()
  phone?: string;

  // Email
  @ApiPropertyOptional({ example: "student@email.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Country
  @ApiPropertyOptional({ example: "Canada" })
  @IsOptional()
  @IsString()
  country?: string;

  // Status
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  // Source
  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  // Priority
  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  // Counselor
  @ApiPropertyOptional({
    description: "Admin only: assign or change counselor",
  })
  @IsOptional()
  @IsString()
  counselorId?: string;

  // IELTS Score
  @ApiPropertyOptional({ example: 6.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ieltsScore?: number;

  // Follow-up Date (fixed format)
  @ApiPropertyOptional({
    example: "2026-04-01",
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  // Lost reason
  @ApiPropertyOptional({ enum: LostReason })
  @IsOptional()
  @IsEnum(LostReason)
  lostReason?: LostReason;

  // Notes
  @ApiPropertyOptional({
    type: [UpdateNoteDto],
    example: [
      { id: "note1", content: "Updated note" },
      { content: "New note added" },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateNoteDto)
  notes?: UpdateNoteDto[];
}
