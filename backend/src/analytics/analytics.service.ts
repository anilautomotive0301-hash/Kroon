import { Injectable } from '@nestjs/common';
import { WorkflowState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardKpis() {
    const [
      totalCampuses,
      totalStudents,
      pendingApprovals,
      inProduction,
      dispatched,
      delivered,
    ] = await Promise.all([
      this.prisma.campus.count({ where: { isActive: true } }),
      this.prisma.student.count(),
      this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.studentWorkflow.count({
        where: { currentState: { in: [WorkflowState.STITCHING, WorkflowState.QUALITY_CHECK, WorkflowState.TAILOR_ASSIGNED] } },
      }),
      this.prisma.studentWorkflow.count({ where: { currentState: WorkflowState.DISPATCHED } }),
      this.prisma.studentWorkflow.count({ where: { currentState: WorkflowState.DELIVERED } }),
    ]);

    return { totalCampuses, totalStudents, pendingApprovals, inProduction, dispatched, delivered };
  }

  async getWorkflowDistribution(campusId?: string) {
    const groups = await this.prisma.studentWorkflow.groupBy({
      by: ['currentState'],
      where: campusId ? { student: { campusId } } : undefined,
      _count: true,
      orderBy: { _count: { currentState: 'desc' } },
    });

    return groups.map((g) => ({ state: g.currentState, count: g._count }));
  }

  async getSizeDistribution(campusId: string) {
    const assignments = await this.prisma.sizeAssignment.findMany({
      where: { student: { campusId } },
      select: { shirtSize: true, trouserSize: true, blazerSize: true },
    });

    const shirtSizes: Record<string, number> = {};
    const trouserSizes: Record<string, number> = {};

    for (const a of assignments) {
      if (a.shirtSize) shirtSizes[a.shirtSize] = (shirtSizes[a.shirtSize] || 0) + 1;
      if (a.trouserSize) trouserSizes[a.trouserSize] = (trouserSizes[a.trouserSize] || 0) + 1;
    }

    return {
      shirtSizes: Object.entries(shirtSizes).map(([size, count]) => ({ size, count })),
      trouserSizes: Object.entries(trouserSizes).map(([size, count]) => ({ size, count })),
    };
  }

  async getFabricConsumptionTrend() {
    const consumptions = await this.prisma.fabricConsumption.findMany({
      include: { fabricItem: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const byMonth: Record<string, Record<string, number>> = {};
    for (const c of consumptions) {
      const month = c.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = {};
      byMonth[month][c.fabricItem.name] = (byMonth[month][c.fabricItem.name] || 0) + c.quantity;
    }

    return Object.entries(byMonth).map(([month, items]) => ({ month, ...items }));
  }

  async getTailorProductivity() {
    const tailors = await this.prisma.user.findMany({
      where: { role: 'TAILOR' },
      select: { id: true, name: true },
    });

    return Promise.all(
      tailors.map(async (tailor) => {
        const [completed, reworks, pending] = await Promise.all([
          this.prisma.stitchingJob.count({
            where: { tailorId: tailor.id, status: 'QUALITY_PASSED' },
          }),
          this.prisma.rework.count({
            where: { job: { tailorId: tailor.id } },
          }),
          this.prisma.stitchingJob.count({
            where: { tailorId: tailor.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          }),
        ]);
        return { ...tailor, completed, reworks, pending };
      }),
    );
  }

  async getDispatchRate(campusId?: string) {
    const [total, dispatched, delivered] = await Promise.all([
      this.prisma.student.count({ where: campusId ? { campusId } : undefined }),
      this.prisma.studentWorkflow.count({
        where: {
          currentState: WorkflowState.DISPATCHED,
          ...(campusId && { student: { campusId } }),
        },
      }),
      this.prisma.studentWorkflow.count({
        where: {
          currentState: WorkflowState.DELIVERED,
          ...(campusId && { student: { campusId } }),
        },
      }),
    ]);

    return {
      total,
      dispatched,
      delivered,
      dispatchRate: total > 0 ? ((dispatched + delivered) / total) * 100 : 0,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }
}
