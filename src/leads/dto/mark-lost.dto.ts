import { IsString, IsOptional, IsNotEmpty } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MarkLostDto {
  // main reason why the lead was lost
  @ApiProperty({ example: "Student chose another consultant" })
  @IsString()
  @IsNotEmpty({ message: "Lost reason is required" })
  lostReason!: string;

  // optional additional details about why the lead was lost
  @ApiPropertyOptional({
    example: "Said fees were lower elsewhere",
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
