import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { Role, VisitStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { CreateVisitDto } from './dto/create-visit.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campus')
export class CampusController {
  constructor(private campusService: CampusService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.campusService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campusService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create(@Body() dto: CreateCampusDto) {
    return this.campusService.create(dto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCampusDto>) {
    return this.campusService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.campusService.deactivate(id);
  }

  // Visits
  @Get(':id/visits')
  getVisits(@Param('id') id: string) {
    return this.campusService.getVisits(id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post(':id/visits')
  createVisit(@Param('id') id: string, @Body() dto: CreateVisitDto) {
    return this.campusService.createVisit(id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.FIELD_STAFF)
  @Patch('visits/:visitId/status')
  updateVisitStatus(
    @Param('visitId') visitId: string,
    @Body('status') status: VisitStatus,
  ) {
    return this.campusService.updateVisitStatus(visitId, status);
  }
}
