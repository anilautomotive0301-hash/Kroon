import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { AssignSizeDto } from './dto/assign-size.dto';

@Injectable()
export class MeasurementsService {
  constructor(private prisma: PrismaService) {}

  async record(dto: CreateMeasurementDto, measuredById: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const measurement = await this.prisma.measurement.create({
      data: { ...dto, measuredById },
      include: {
        student: { select: { id: true, name: true, studentCode: true } },
        measuredBy: { select: { id: true, name: true } },
      },
    });

    // Advance workflow to MEASURED
    await this.advanceWorkflow(dto.studentId, WorkflowState.MEASURED, measuredById);

    return measurement;
  }

  async getForStudent(studentId: string) {
    return this.prisma.measurement.findMany({
      where: { studentId },
      include: { measuredBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignSize(dto: AssignSizeDto, assignedById: string) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.prisma.sizeAssignment.findUnique({
      where: { studentId: dto.studentId },
    });

    const { studentId, ...sizeFields } = dto;
    const assignment = await this.prisma.sizeAssignment.upsert({
      where: { studentId: dto.studentId },
      create: { ...dto, assignedById },
      update: { ...sizeFields },
    });

    // Audit trail
    await this.prisma.auditLog.create({
      data: {
        entityType: 'SizeAssignment',
        entityId: assignment.id,
        action: existing ? 'UPDATE' : 'CREATE',
        oldValue: existing as any,
        newValue: assignment as any,
        performedById: assignedById,
        sizeAssignmentId: assignment.id,
      },
    });

    // Advance workflow to SIZE_ASSIGNED
    await this.advanceWorkflow(dto.studentId, WorkflowState.SIZE_ASSIGNED, assignedById);

    return assignment;
  }

  async getSizeAssignment(studentId: string) {
    return this.prisma.sizeAssignment.findUnique({
      where: { studentId },
      include: {
        assignedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        auditLogs: {
          include: { performedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  private async advanceWorkflow(
    studentId: string,
    toState: WorkflowState,
    changedById: string,
  ) {
    const workflow = await this.prisma.studentWorkflow.findUnique({
      where: { studentId },
    });
    if (!workflow) return;

    const fromState = workflow.currentState;
    if (fromState === toState) return;

    // Only advance forward through the linear workflow — never backwards.
    // This prevents re-recording a measurement from resetting a student
    // who is already in production, dispatch, or delivery.
    const WORKFLOW_ORDER: WorkflowState[] = [
      WorkflowState.REGISTERED,
      WorkflowState.MEASUREMENT_PENDING,
      WorkflowState.MEASURED,
      WorkflowState.SIZE_ASSIGNED,
      WorkflowState.PENDING_APPROVAL,
      WorkflowState.APPROVED,
      WorkflowState.FABRIC_ALLOCATED,
      WorkflowState.TAILOR_ASSIGNED,
      WorkflowState.STITCHING,
      WorkflowState.QUALITY_CHECK,
      WorkflowState.DISPATCHED,
      WorkflowState.DELIVERED,
    ];
    const fromIdx = WORKFLOW_ORDER.indexOf(fromState);
    const toIdx = WORKFLOW_ORDER.indexOf(toState);
    if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) return;

    await this.prisma.$transaction([
      this.prisma.studentWorkflow.update({
        where: { studentId },
        data: { currentState: toState },
      }),
      this.prisma.workflowHistory.create({
        data: { workflowId: workflow.id, fromState, toState, changedById },
      }),
    ]);
  }
}
