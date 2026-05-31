import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateVisitDto {
  @IsDateString()
  scheduledAt: string;

  @IsString()
  assignedToId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
