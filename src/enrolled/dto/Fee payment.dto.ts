import { PaymentMode, PaymentStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFeePaymentDto {
  @ApiProperty({
    example: "Tuition Fee",
    description:
      "Type of fee (e.g. Tuition Fee, Application Fee, Accommodation Fee, Visa Fee)",
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    example: 12500,
    description: "Fee amount (must be >= 0)",
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    example: "2025-08-01",
    description: "Payment due date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: "PENDING",
    description: "Payment status — defaults to PENDING if omitted",
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    enum: PaymentMode,
    example: "BANK_TRANSFER",
    description: "Payment method used",
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({
    example: "First instalment — wire transfer ref TXN-001",
    description: "Internal notes about this payment line item",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFeePaymentDto {
  @ApiPropertyOptional({
    example: "Accommodation Fee",
    description: "Updated fee type label",
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 6000,
    description: "Updated fee amount (must be >= 0)",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    example: "2025-09-15",
    description: "Updated due date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: "PAID",
    description: "Updated payment status",
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    enum: PaymentMode,
    example: "CREDIT_CARD",
    description: "Updated payment method",
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({
    example: "2025-08-28",
    description: "Actual date payment was received (ISO 8601)",
  })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiPropertyOptional({
    example: "Payment confirmed by accounts on 28 Aug",
    description: "Updated notes about this payment",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
