import { IsOptional, IsString, IsEnum, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { EnrollmentStage, VisaStatus, FeeStatus } from "@prisma/client";

export class EnrolledQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  counselorId?: string;

  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @IsOptional()
  @IsEnum(EnrollmentStage)
  stage?: EnrollmentStage;

  @IsOptional()
  @IsEnum(FeeStatus)
  feeStatus?: FeeStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
