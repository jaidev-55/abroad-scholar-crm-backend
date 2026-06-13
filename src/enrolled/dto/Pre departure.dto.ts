import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePreDepartureDto {
  @IsString()
  @IsNotEmpty()
  taskName!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePreDepartureDto {
  @IsOptional()
  @IsString()
  taskName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
