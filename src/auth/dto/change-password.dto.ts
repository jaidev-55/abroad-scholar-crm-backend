import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    description: "Your current password",
    example: "OldPassword@123",
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: "Your new password (minimum 6 characters)",
    example: "NewPassword@456",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters" })
  newPassword!: string;
}
