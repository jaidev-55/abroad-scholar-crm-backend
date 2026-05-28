import { ApiPropertyOptional } from "@nestjs/swagger";
import { IeltsExamType, IeltsStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class IeltsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: IeltsStatus })
  @IsOptional()
  @IsEnum(IeltsStatus)
  status?: IeltsStatus;

  @ApiPropertyOptional({ enum: IeltsExamType })
  @IsOptional()
  @IsEnum(IeltsExamType)
  examType?: IeltsExamType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  counselorId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
