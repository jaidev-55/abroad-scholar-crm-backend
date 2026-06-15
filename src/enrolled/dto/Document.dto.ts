import { DocumentStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UploadDocumentDto {
  @ApiProperty({
    example: "Passport Copy",
    description:
      "Display name for the document (e.g. Passport, Offer Letter, SOP)",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: "2030-06-01",
    description:
      "Document expiry date in ISO 8601 format (e.g. for passport, visa)",
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: "Valid for 10 years, issued in India",
    description: "Internal notes about this document",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    enum: DocumentStatus,
    example: "VERIFIED",
    description: "Updated document status",
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({
    example: "2030-06-01",
    description: "Updated expiry date in ISO 8601 format",
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: "Renewed passport uploaded",
    description: "Updated notes about this document",
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: "Renewed Passport Copy",
    description: "Updated display name for the document",
  })
  @IsOptional()
  @IsString()
  name?: string;
}
