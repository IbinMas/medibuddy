import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MealTiming } from '@prisma/client';

export class CreatePrescriptionDto {
  @IsString()
  patientId!: string;

  @IsString()
  medication!: string;

  @IsString()
  dosage!: string;

  @IsString()
  frequency!: string;

  @IsEnum(MealTiming)
  @IsOptional()
  mealTiming?: MealTiming;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
