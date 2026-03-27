import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SendTemplateEmailDto {
  @ApiProperty({
    example: "template-id-uuid",
    description: "Email template ID",
  })
  @IsString()
  templateId!: string;
}
