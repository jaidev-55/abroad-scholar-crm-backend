import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { UserRole } from "@prisma/client";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsOptional()
  @IsEmail({}, { message: "Enter a valid email" })
  email?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: "COUNSELOR",
    description: "Only admins can change roles",
  })
  @IsOptional()
  @IsEnum(UserRole, { message: "Role must be ADMIN or COUNSELOR" })
  role?: UserRole;
}
