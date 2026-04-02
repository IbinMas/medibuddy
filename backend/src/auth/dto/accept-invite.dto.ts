import { IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  code!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
