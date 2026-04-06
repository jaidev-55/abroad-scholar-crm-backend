import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendCustomEmailDto {
  @ApiProperty({ example: "Follow-up on your application" })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: "Hi John, just checking in..." })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
