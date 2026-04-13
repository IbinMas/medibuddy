import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestEmailVerificationDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email!: string;
}
