import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('kpis')
  getDashboardKpis() {
    return this.analyticsService.getDashboardKpis();
  }

  @Get('workflow-distribution')
  getWorkflowDistribution(@Query('campusId') campusId?: string) {
    return this.analyticsService.getWorkflowDistribution(campusId);
  }

  @Get('size-distribution/:campusId')
  getSizeDistribution(@Param('campusId') campusId: string) {
    return this.analyticsService.getSizeDistribution(campusId);
  }

  @Get('fabric-trend')
  getFabricConsumptionTrend() {
    return this.analyticsService.getFabricConsumptionTrend();
  }

  @Get('tailor-productivity')
  getTailorProductivity() {
    return this.analyticsService.getTailorProductivity();
  }

  @Get('dispatch-rate')
  getDispatchRate(@Query('campusId') campusId?: string) {
    return this.analyticsService.getDispatchRate(campusId);
  }
}
