import { VisaStatus, VisaType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateVisaDetailDto {
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsDateString()
  passportExpiry?: string;

  @IsOptional()
  @IsEnum(VisaType)
  visaType?: VisaType;

  @IsOptional()
  @IsEnum(VisaStatus)
  visaStatus?: VisaStatus;

  @IsOptional()
  @IsDateString()
  filingDate?: string;

  @IsOptional()
  @IsDateString()
  biometricDate?: string;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @IsOptional()
  @IsDateString()
  decisionDate?: string;
}
