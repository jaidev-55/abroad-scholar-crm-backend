import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWebhookConfigDto {
  @ApiProperty({ example: "META" })
  @IsString()
  @IsNotEmpty()
  platform!: string;

  @ApiProperty({ example: "123456789" })
  @IsString()
  @IsNotEmpty()
  formId!: string;

  @ApiProperty({ example: "UK Student Intake 2026" })
  @IsString()
  @IsNotEmpty()
  formName!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
