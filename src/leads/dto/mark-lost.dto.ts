import { IsString, IsOptional, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LostReason } from "@prisma/client";

export class MarkLostDto {
  @ApiProperty({
    example: "CHOSE_OTHER_CONSULTANT",
    enum: LostReason,
    description: "Must be a valid LostReason enum value",
  })
  @IsEnum(LostReason, {
    message: `lostReason must be one of: ${Object.values(LostReason).join(", ")}`,
  })
  @IsNotEmpty({ message: "Lost reason is required" })
  lostReason!: LostReason;

  @ApiPropertyOptional({
    example: "Said fees were lower elsewhere",
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
