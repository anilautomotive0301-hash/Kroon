import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DispatchStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { DispatchService } from './dispatch.service';

@UseGuards(JwtAuthGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private dispatchService: DispatchService) {}

  @Get()
  findAll(@Query('campusId') campusId?: string) {
    return this.dispatchService.findAll(campusId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dispatchService.findOne(id);
  }

  @Post()
  createOrder(
    @Body() body: {
      campusId: string;
      studentItems: { studentId: string; uniformType: string; quantity: number }[];
      vehicleNo?: string;
      driverName?: string;
      notes?: string;
    },
    @GetUser('id') userId: string,
  ) {
    return this.dispatchService.createOrder(
      body.campusId,
      body.studentItems,
      userId,
      { vehicleNo: body.vehicleNo, driverName: body.driverName, notes: body.notes },
    );
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: DispatchStatus) {
    return this.dispatchService.updateStatus(id, status);
  }

  @Patch(':id/delivered/:studentId')
  markDelivered(
    @Param('id') orderId: string,
    @Param('studentId') studentId: string,
    @GetUser('id') userId: string,
  ) {
    return this.dispatchService.markDelivered(orderId, studentId, userId);
  }
}
