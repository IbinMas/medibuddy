import { IsOptional, IsString } from 'class-validator';

export class UpdatePharmacyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
