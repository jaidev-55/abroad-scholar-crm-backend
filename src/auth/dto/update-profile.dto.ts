import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "Your display name",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name?: string;

  @ApiPropertyOptional({
    description: "Your email address",
    example: "john@example.com",
  })
  @IsOptional()
  @IsEmail({}, { message: "Enter a valid email" })
  email?: string;
}
