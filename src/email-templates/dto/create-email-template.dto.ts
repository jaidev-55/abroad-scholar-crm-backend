import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateEmailTemplateDto {
  @ApiProperty({
    example: "Follow-up",
    description: "Template name",
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: "Follow-up Regarding Your Study Abroad Enquiry",
    description: "Email subject",
  })
  @IsString()
  subject!: string;

  @ApiProperty({
    example:
      "Dear {{name}}, Greetings from Abroad Scholar! We tried reaching you regarding your enquiry.",
    description: "Email message template body",
  })
  @IsString()
  content!: string;
}
