import { IsOptional, IsString, IsEnum, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStage, VisaStatus, FeeStatus } from "@prisma/client";

export class EnrolledQueryDto {
  @ApiPropertyOptional({
    example: "Arjun",
    description: "Search by student full name or student ID",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "UK",
    description: "Filter by destination country",
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: "clxyz123counselorid",
    description: "Filter by assigned counselor ID",
  })
  @IsOptional()
  @IsString()
  counselorId?: string;

  @ApiPropertyOptional({
    enum: VisaStatus,
    example: "IN_PROGRESS",
    description: "Filter by visa status",
  })
  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @ApiPropertyOptional({
    enum: EnrollmentStage,
    example: "FEE_PAID",
    description: "Filter by enrollment pipeline stage",
  })
  @IsOptional()
  @IsEnum(EnrollmentStage)
  stage?: EnrollmentStage;

  @ApiPropertyOptional({
    enum: FeeStatus,
    example: "PARTIAL",
    description: "Filter by fee payment status",
  })
  @IsOptional()
  @IsEnum(FeeStatus)
  feeStatus?: FeeStatus;

  @ApiPropertyOptional({
    example: "createdAt",
    description: "Field to sort by (e.g. createdAt, fullName, intakeDate)",
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    example: "desc",
    enum: ["asc", "desc"],
    description: "Sort direction",
    default: "desc",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({
    example: 1,
    description: "Page number (1-based)",
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: "Number of records per page",
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
