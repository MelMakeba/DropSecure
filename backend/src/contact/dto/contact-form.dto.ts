import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
