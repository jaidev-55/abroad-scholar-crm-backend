import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsEnum, IsString } from "class-validator";

export enum UserRole {
  ADMIN = "ADMIN",
  COUNSELOR = "COUNSELOR",
}

export class UpdateUserDto {
  // User full name
  @ApiPropertyOptional({ example: "Jai" })
  @IsOptional()
  @IsString()
  name?: string;

  // User email address
  @ApiPropertyOptional({ example: "Jai@gmail.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Role of the user (ADMIN or COUNSELOR)
  @ApiPropertyOptional({
    example: "COUNSELOR",
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
