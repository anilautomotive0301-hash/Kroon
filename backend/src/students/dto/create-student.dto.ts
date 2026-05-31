import { Gender } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  campusId: string;

  @IsString()
  studentCode: string;

  @IsString()
  name: string;

  @IsString()
  class: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsInt()
  @Min(3)
  age?: number;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;
}
