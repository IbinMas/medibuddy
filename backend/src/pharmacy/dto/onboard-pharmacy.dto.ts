import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Plan } from '@prisma/client';

export class OnboardPharmacyDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsEnum(Plan)
  plan!: Plan;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
