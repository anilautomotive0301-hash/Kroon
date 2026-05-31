import { Injectable, NotFoundException } from '@nestjs/common';
import { StitchingStatus, WorkflowState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async createAssignment(tailorId: string, campusId: string, batchName: string, studentIds: string[]) {
    const assignment = await this.prisma.tailorAssignment.create({
      data: { tailorId, campusId, batchName, status: StitchingStatus.PENDING },
    });

    await this.prisma.stitchingJob.createMany({
      data: studentIds.map((studentId) => ({
        assignmentId: assignment.id,
        studentId,
        tailorId,
        status: StitchingStatus.PENDING,
      })),
    });

    // Advance workflow for each student
    for (const studentId of studentIds) {
      const workflow = await this.prisma.studentWorkflow.findUnique({ where: { studentId } });
      if (workflow) {
        await this.prisma.$transaction([
          this.prisma.studentWorkflow.update({
            where: { studentId },
            data: { currentState: WorkflowState.TAILOR_ASSIGNED },
          }),
          this.prisma.workflowHistory.create({
            data: {
              workflowId: workflow.id,
              fromState: workflow.currentState,
              toState: WorkflowState.TAILOR_ASSIGNED,
              changedById: tailorId,
            },
          }),
        ]);
      }
    }

    return this.prisma.tailorAssignment.findUnique({
      where: { id: assignment.id },
      include: {
        tailor: { select: { id: true, name: true } },
        stitchingJobs: { include: { reworks: true } },
      },
    });
  }

  async getAssignments(tailorId?: string) {
    return this.prisma.tailorAssignment.findMany({
      where: tailorId ? { tailorId } : undefined,
      include: {
        tailor: { select: { id: true, name: true } },
        _count: { select: { stitchingJobs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateJobStatus(
    jobId: string,
    status: StitchingStatus,
    userId: string,
    qualityNotes?: string,
  ) {
    const job = await this.prisma.stitchingJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Stitching job not found');

    const data: Record<string, any> = { status };
    if (status === StitchingStatus.IN_PROGRESS) data.startedAt = new Date();
    if (status === StitchingStatus.QUALITY_PENDING) data.completedAt = new Date();
    if (status === StitchingStatus.QUALITY_PASSED || status === StitchingStatus.QUALITY_FAILED) {
      data.qualityCheckedAt = new Date();
      data.qualityCheckedById = userId;
      data.qualityNotes = qualityNotes;
    }

    const updated = await this.prisma.stitchingJob.update({
      where: { id: jobId },
      data,
    });

    // Map stitching status → workflow state
    const stateMap: Partial<Record<StitchingStatus, WorkflowState>> = {
      [StitchingStatus.IN_PROGRESS]: WorkflowState.STITCHING,
      [StitchingStatus.QUALITY_PENDING]: WorkflowState.QUALITY_CHECK,
      [StitchingStatus.QUALITY_FAILED]: WorkflowState.REWORK,
    };

    const targetState = stateMap[status];
    if (targetState) {
      const workflow = await this.prisma.studentWorkflow.findUnique({
        where: { studentId: job.studentId },
      });
      if (workflow) {
        await this.prisma.$transaction([
          this.prisma.studentWorkflow.update({
            where: { studentId: job.studentId },
            data: { currentState: targetState },
          }),
          this.prisma.workflowHistory.create({
            data: {
              workflowId: workflow.id,
              fromState: workflow.currentState,
              toState: targetState,
              changedById: userId,
            },
          }),
        ]);
      }
    }

    return updated;
  }

  async reportRework(jobId: string, reason: string, description: string, userId: string) {
    const job = await this.prisma.stitchingJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Stitching job not found');

    return this.prisma.rework.create({
      data: { jobId, reason, description, reportedById: userId },
    });
  }

  async getTailorStats(tailorId: string) {
    const jobs = await this.prisma.stitchingJob.groupBy({
      by: ['status'],
      where: { tailorId },
      _count: true,
    });
    return jobs;
  }
}
