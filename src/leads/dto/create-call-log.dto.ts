import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Possible outcomes of a counselor call with a lead
export enum CallOutcome {
  INTERESTED = "INTERESTED",
  CONVERTED = "CONVERTED",
  SCHEDULE_CALLBACK = "SCHEDULE_CALLBACK",
  NOT_INTERESTED = "NOT_INTERESTED",
  NO_ANSWER = "NO_ANSWER",
  VOICEMAIL = "VOICEMAIL",
}

// DTO used to log a call activity for a lead
export class CreateCallLogDto {
  @ApiProperty({ enum: CallOutcome })
  @IsEnum(CallOutcome)
  outcome!: CallOutcome;

  // Optional notes about the call conversation
  @ApiPropertyOptional({ example: "Student interested in UK intake" })
  @IsOptional()
  @IsString()
  notes?: string;

  // Duration of the call in seconds
  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  // Call quality or interest rating (1–5)
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  rating?: number;

  // Next follow-up date for this lead
  @ApiPropertyOptional({
    example: "2026-03-15T10:00:00.000Z",
    description: "Next follow-up date for this lead",
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
