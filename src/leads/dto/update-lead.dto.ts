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
  LeadCategory,
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
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: "+919876543210" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "student@email.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "Canada" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({
    description: "Admin only: assign or change counselor",
  })
  @IsOptional()
  @IsString()
  counselorId?: string;

  @ApiPropertyOptional({ example: 6.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ieltsScore?: number;

  @ApiPropertyOptional({ example: "2026-04-01" })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ enum: LostReason })
  @IsOptional()
  @IsEnum(LostReason)
  lostReason?: LostReason;

  @ApiPropertyOptional({
    enum: ["ACADEMIC", "ADMISSION"],
    example: "ADMISSION",
    description:
      "Lead category — ACADEMIC (IELTS/PTE) or ADMISSION (University)",
  })
  @IsOptional()
  @IsEnum(LeadCategory)
  category?: LeadCategory;

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
