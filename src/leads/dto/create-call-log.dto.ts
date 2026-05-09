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

// Pipeline status set after a call — shown on the Kanban card
export enum PipelineStatus {
  COUNSELLING_COMPLETED = "COUNSELLING_COMPLETED",
  FOLLOW_UP = "FOLLOW_UP",
  ACTIVE_PIPELINE = "ACTIVE_PIPELINE",
  DOCS_PENDING = "DOCS_PENDING",
  NO_RESPONSE_1ST_CALL = "NO_RESPONSE_1ST_CALL",
}

// DTO used to log a call activity for a lead
export class CreateCallLogDto {
  @ApiProperty({ enum: CallOutcome })
  @IsEnum(CallOutcome)
  outcome!: CallOutcome;

  // Pipeline status to update on the lead card
  @ApiPropertyOptional({ enum: PipelineStatus })
  @IsOptional()
  @IsEnum(PipelineStatus)
  pipelineStatus?: PipelineStatus;

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
