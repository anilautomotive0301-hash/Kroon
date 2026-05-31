import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { AssignSizeDto } from './dto/assign-size.dto';

@UseGuards(JwtAuthGuard)
@Controller('measurements')
export class MeasurementsController {
  constructor(private measurementsService: MeasurementsService) {}

  @Post()
  record(@Body() dto: CreateMeasurementDto, @GetUser('id') userId: string) {
    return this.measurementsService.record(dto, userId);
  }

  @Get('student/:studentId')
  getForStudent(@Param('studentId') studentId: string) {
    return this.measurementsService.getForStudent(studentId);
  }

  @Post('size')
  assignSize(@Body() dto: AssignSizeDto, @GetUser('id') userId: string) {
    return this.measurementsService.assignSize(dto, userId);
  }

  @Get('size/:studentId')
  getSizeAssignment(@Param('studentId') studentId: string) {
    return this.measurementsService.getSizeAssignment(studentId);
  }
}
