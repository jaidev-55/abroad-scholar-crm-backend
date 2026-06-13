import { CommissionStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateCommissionDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  universityRate!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subAgentRate?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  expectedAmount!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  receivedAmount?: number;

  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCommissionDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  universityRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subAgentRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  expectedAmount?: number;

  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsString()
  agreementUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordCommissionPaymentDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
