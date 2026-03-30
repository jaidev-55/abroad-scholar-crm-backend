import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from "class-validator";
import { LeadSource, LeadPriority } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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

  @ApiProperty({ example: "UK" })
  @IsString()
  country!: string;

  @ApiProperty({ enum: LeadSource })
  @IsEnum(LeadSource)
  source!: LeadSource;

  @ApiPropertyOptional({ enum: ["NEW", "IN_PROGRESS", "CONVERTED", "LOST"] })
  @IsOptional()
  @IsEnum(["NEW", "IN_PROGRESS", "CONVERTED", "LOST"])
  status?: "NEW" | "IN_PROGRESS" | "CONVERTED" | "LOST";

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counselorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ieltsScore?: number;

  @ApiPropertyOptional({ example: "2026-03-05T10:00:00Z" })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
