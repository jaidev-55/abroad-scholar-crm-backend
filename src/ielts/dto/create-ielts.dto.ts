import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IeltsExamType, IeltsStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateIeltsDto {
  @ApiProperty()
  @IsString()
  studentName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ enum: IeltsExamType })
  @IsEnum(IeltsExamType)
  examType!: IeltsExamType;

  @ApiPropertyOptional({ enum: IeltsStatus })
  @IsOptional()
  @IsEnum(IeltsStatus)
  status?: IeltsStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUniversity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counselorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  requiredScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetL?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetR?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetW?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetS?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetOA?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
