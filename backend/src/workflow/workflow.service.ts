import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus, WorkflowState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const VALID_TRANSITIONS: Partial<Record<WorkflowState, WorkflowState[]>> = {
  [WorkflowState.REGISTERED]: [WorkflowState.MEASUREMENT_PENDING],
  [WorkflowState.MEASUREMENT_PENDING]: [WorkflowState.MEASURED],
  [WorkflowState.MEASURED]: [WorkflowState.SIZE_ASSIGNED],
  [WorkflowState.SIZE_ASSIGNED]: [WorkflowState.PENDING_APPROVAL],
  [WorkflowState.PENDING_APPROVAL]: [WorkflowState.APPROVED, WorkflowState.SIZE_ASSIGNED],
  [WorkflowState.APPROVED]: [WorkflowState.FABRIC_ALLOCATED],
  [WorkflowState.FABRIC_ALLOCATED]: [WorkflowState.TAILOR_ASSIGNED],
  [WorkflowState.TAILOR_ASSIGNED]: [WorkflowState.STITCHING],
  [WorkflowState.STITCHING]: [WorkflowState.QUALITY_CHECK, WorkflowState.REWORK],
  [WorkflowState.QUALITY_CHECK]: [WorkflowState.DISPATCHED, WorkflowState.REWORK],
  [WorkflowState.REWORK]: [WorkflowState.STITCHING],
  [WorkflowState.DISPATCHED]: [WorkflowState.DELIVERED],
};

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async getStudentWorkflow(studentId: string) {
    const workflow = await this.prisma.studentWorkflow.findUnique({
      where: { studentId },
      include: {
        history: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        approvalRequest: {
          include: {
            requestedBy: { select: { id: true, name: true } },
            supervisor: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return workflow;
  }

  async transition(
    studentId: string,
    toState: WorkflowState,
    userId: string,
    reason?: string,
  ) {
    const workflow = await this.prisma.studentWorkflow.findUnique({
      where: { studentId },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');

    const allowed = VALID_TRANSITIONS[workflow.currentState] || [];
    if (!allowed.includes(toState)) {
      throw new BadRequestException(
        `Cannot transition from ${workflow.currentState} to ${toState}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.studentWorkflow.update({
        where: { studentId },
        data: { currentState: toState },
      }),
      this.prisma.workflowHistory.create({
        data: {
          workflowId: workflow.id,
          fromState: workflow.currentState,
          toState,
          changedById: userId,
          reason,
        },
      }),
    ]);

    return this.getStudentWorkflow(studentId);
  }

  async submitForApproval(studentId: string, requestedById: string) {
    const workflow = await this.prisma.studentWorkflow.findUnique({
      where: { studentId },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');

    if (workflow.currentState !== WorkflowState.SIZE_ASSIGNED) {
      throw new BadRequestException('Student must be in SIZE_ASSIGNED state to submit for approval');
    }

    // Upsert approval request
    const approval = await this.prisma.approvalRequest.upsert({
      where: { workflowId: workflow.id },
      create: { workflowId: workflow.id, requestedById, status: ApprovalStatus.PENDING },
      update: { status: ApprovalStatus.PENDING, reviewedAt: null },
    });

    await this.transition(studentId, WorkflowState.PENDING_APPROVAL, requestedById, 'Submitted for approval');

    return approval;
  }

  async reviewApproval(
    workflowId: string,
    supervisorId: string,
    status: ApprovalStatus,
    notes?: string,
  ) {
    const approval = await this.prisma.approvalRequest.findUnique({
      where: { workflowId },
      include: { workflow: true },
    });
    if (!approval) throw new NotFoundException('Approval request not found');

    await this.prisma.approvalRequest.update({
      where: { workflowId },
      data: { status, supervisorId, notes, reviewedAt: new Date() },
    });

    if (status === ApprovalStatus.APPROVED) {
      await this.transition(approval.workflow.studentId, WorkflowState.APPROVED, supervisorId, notes);
    } else if (status === ApprovalStatus.REJECTED || status === ApprovalStatus.REVISION_REQUESTED) {
      await this.transition(approval.workflow.studentId, WorkflowState.SIZE_ASSIGNED, supervisorId, notes);
    }

    return this.prisma.approvalRequest.findUnique({ where: { workflowId } });
  }

  async getPendingApprovals(supervisorId?: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        ...(supervisorId && { supervisorId }),
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        workflow: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentCode: true,
                class: true,
                campus: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getByCampusState(campusId: string, state?: WorkflowState) {
    return this.prisma.studentWorkflow.findMany({
      where: {
        ...(state && { currentState: state }),
        student: { campusId },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true,
            class: true,
            section: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
