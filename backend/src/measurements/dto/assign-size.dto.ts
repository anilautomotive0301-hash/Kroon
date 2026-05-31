import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AssignSizeDto {
  @IsString()
  studentId: string;

  @IsOptional() @IsString() shirtSize?: string;
  @IsOptional() @IsString() trouserSize?: string;
  @IsOptional() @IsString() blazerSize?: string;
  @IsOptional() @IsString() tieSize?: string;
  @IsOptional() @IsString() customNotes?: string;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;
}
