import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  otp!: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
