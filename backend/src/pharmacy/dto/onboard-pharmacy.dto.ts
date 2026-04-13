import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Plan } from '@prisma/client';

export class OnboardPharmacyDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsEnum(Plan)
  plan!: Plan;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
