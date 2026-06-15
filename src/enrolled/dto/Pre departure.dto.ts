import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePreDepartureDto {
  @ApiProperty({
    example: "Book airport pickup",
    description: "Name of the pre-departure task",
  })
  @IsString()
  @IsNotEmpty()
  taskName!: string;

  @ApiPropertyOptional({
    example: "TRAVEL",
    enum: [
      "TRAVEL",
      "ACCOMMODATION",
      "FINANCE",
      "DOCUMENTS",
      "HEALTH",
      "OTHER",
    ],
    description: "Task category",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: "Arrange pickup from Heathrow Terminal 5",
    description: "Additional notes or instructions for this task",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePreDepartureDto {
  @ApiPropertyOptional({
    example: "Confirm accommodation booking",
    description: "Updated task name",
  })
  @IsOptional()
  @IsString()
  taskName?: string;

  @ApiPropertyOptional({
    example: "ACCOMMODATION",
    enum: [
      "TRAVEL",
      "ACCOMMODATION",
      "FINANCE",
      "DOCUMENTS",
      "HEALTH",
      "OTHER",
    ],
    description: "Updated task category",
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Mark task as completed (true) or pending (false)",
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    example: "https://s3.amazonaws.com/bucket/booking-confirmation.pdf",
    description: "URL of the proof/attachment file for this task",
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({
    example: "Booking confirmed — ref BK-20250901",
    description: "Updated notes for this task",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
