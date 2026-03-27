import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({
    description: "Email used during registration",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "6-digit OTP sent to the user's email",
  })
  @IsString()
  @Length(6, 6)
  otp!: string;
}
