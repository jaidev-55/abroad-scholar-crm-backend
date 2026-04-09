import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayNotEmpty, IsUUID } from "class-validator";

export class DeleteMultipleLeadsDto {
  @ApiProperty({
    type: [String],
    description: "Array of lead UUIDs to delete",
    example: [
      "",
      "",
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("all", { each: true })
  ids!: string[];
}
