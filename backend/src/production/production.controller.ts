import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StitchingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ProductionService } from './production.service';

@UseGuards(JwtAuthGuard)
@Controller('production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get('assignments')
  getAssignments(@Query('tailorId') tailorId?: string) {
    return this.productionService.getAssignments(tailorId);
  }

  @Post('assignments')
  createAssignment(
    @Body() body: { tailorId: string; campusId: string; batchName: string; studentIds: string[] },
  ) {
    return this.productionService.createAssignment(
      body.tailorId,
      body.campusId,
      body.batchName,
      body.studentIds,
    );
  }

  @Patch('jobs/:jobId/status')
  updateJobStatus(
    @Param('jobId') jobId: string,
    @Body('status') status: StitchingStatus,
    @Body('qualityNotes') qualityNotes: string,
    @GetUser('id') userId: string,
  ) {
    return this.productionService.updateJobStatus(jobId, status, userId, qualityNotes);
  }

  @Post('jobs/:jobId/rework')
  reportRework(
    @Param('jobId') jobId: string,
    @Body('reason') reason: string,
    @Body('description') description: string,
    @GetUser('id') userId: string,
  ) {
    return this.productionService.reportRework(jobId, reason, description, userId);
  }

  @Get('tailor/:tailorId/stats')
  getTailorStats(@Param('tailorId') tailorId: string) {
    return this.productionService.getTailorStats(tailorId);
  }
}
