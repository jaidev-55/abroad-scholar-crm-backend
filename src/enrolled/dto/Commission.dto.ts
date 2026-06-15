import { CommissionStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCommissionDto {
  @ApiProperty({
    example: 18,
    description: "University commission rate as a percentage (e.g. 18 = 18%)",
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  universityRate!: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Sub-agent commission rate as a percentage",
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subAgentRate?: number;

  @ApiProperty({
    example: 3451,
    description: "Total expected commission amount in USD",
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  expectedAmount!: number;

  @ApiPropertyOptional({
    example: 0,
    description: "Amount already received at time of creation",
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  receivedAmount?: number;

  @ApiPropertyOptional({
    enum: CommissionStatus,
    example: "PENDING",
    description: "Payment status — auto-computed from amounts if omitted",
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({
    example: "Commission agreed per signed MOU dated Jan 2025",
    description: "Internal notes about this commission",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCommissionDto {
  @ApiPropertyOptional({
    example: 20,
    description: "Updated university commission rate (%)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  universityRate?: number;

  @ApiPropertyOptional({
    example: 2,
    description: "Updated sub-agent commission rate (%)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subAgentRate?: number;

  @ApiPropertyOptional({
    example: 4000,
    description: "Updated expected commission amount",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  expectedAmount?: number;

  @ApiPropertyOptional({
    enum: CommissionStatus,
    example: "PARTIAL",
    description: "Override the payment status",
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({
    example: "https://s3.amazonaws.com/bucket/agreement.pdf",
    description: "URL of the signed commission agreement file",
  })
  @IsOptional()
  @IsString()
  agreementUrl?: string;

  @ApiPropertyOptional({
    example: "Rate revised after university renegotiation",
    description: "Internal notes about this update",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordCommissionPaymentDto {
  @ApiProperty({
    example: 1725.5,
    description: "Amount received in this payment (must be > 0)",
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    example: "Wire transfer ref TXN-20250310",
    description: "Payment reference, method, or notes",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
