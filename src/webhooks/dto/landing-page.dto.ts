import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LandingPageWebhookDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phone!: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  notes?: string;
}
