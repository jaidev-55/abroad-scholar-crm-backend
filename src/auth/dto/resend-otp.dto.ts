import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendOtpDto {
  @ApiProperty({
    example: "admin@test.com",
    description: "Email used during registration",
  })
  @IsEmail()
  email!: string;
}
