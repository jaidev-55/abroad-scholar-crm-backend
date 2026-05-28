import { ApiPropertyOptional } from "@nestjs/swagger";
import { IeltsTestType } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateScoresDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  listening?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  reading?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  writing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  speaking?: number;

  @ApiPropertyOptional({ enum: IeltsTestType })
  @IsOptional()
  @IsEnum(IeltsTestType)
  testType?: IeltsTestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
