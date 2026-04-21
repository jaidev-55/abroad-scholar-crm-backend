import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateIf,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import {
  LeadSource,
  LeadPriority,
  LeadStatus,
  LeadCategory,
} from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum AssignmentType {
  AUTO = "AUTO",
  MANUAL = "MANUAL",
}

export class CreateLeadDto {
  @ApiProperty({ example: "Aarav Mehta" })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: "9876543210" })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: "aarav@gmail.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "UK" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ enum: LeadSource })
  @IsEnum(LeadSource)
  source!: LeadSource;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({ enum: AssignmentType, default: AssignmentType.AUTO })
  @IsOptional()
  @IsEnum(AssignmentType)
  assignmentType?: AssignmentType;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.assignmentType === AssignmentType.MANUAL)
  @IsNotEmpty({ message: "Counselor is required for manual assignment" })
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

  @ApiPropertyOptional({
    type: [String],
    example: ["Interested in UK", "Needs scholarship"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];

  @ApiPropertyOptional({ enum: LeadCategory, example: "ADMISSION" })
  @IsOptional()
  @IsEnum(LeadCategory)
  category?: LeadCategory;
}
