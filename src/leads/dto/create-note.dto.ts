import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateNoteDto {
  // Content of the note written by counselor
  @ApiProperty({ example: "Student asked about Ireland visa process" })
  @IsString()
  content!: string;
}
