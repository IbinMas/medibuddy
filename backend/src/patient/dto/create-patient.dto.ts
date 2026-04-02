import { IsOptional, IsString, IsEnum } from 'class-validator';
import { NotificationMedium } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(NotificationMedium)
  notificationMedium?: NotificationMedium;
}
