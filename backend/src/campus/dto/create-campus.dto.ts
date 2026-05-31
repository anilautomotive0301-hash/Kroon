import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCampusDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  contactName: string;

  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
