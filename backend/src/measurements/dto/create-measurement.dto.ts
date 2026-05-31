import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMeasurementDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  visitId?: string;

  @IsOptional() @IsNumber() @Min(0) chest?: number;
  @IsOptional() @IsNumber() @Min(0) waist?: number;
  @IsOptional() @IsNumber() @Min(0) hip?: number;
  @IsOptional() @IsNumber() @Min(0) shoulder?: number;
  @IsOptional() @IsNumber() @Min(0) sleeveLength?: number;
  @IsOptional() @IsNumber() @Min(0) shirtLength?: number;
  @IsOptional() @IsNumber() @Min(0) trouserLength?: number;
  @IsOptional() @IsNumber() @Min(0) inseam?: number;
  @IsOptional() @IsNumber() @Min(0) neck?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
