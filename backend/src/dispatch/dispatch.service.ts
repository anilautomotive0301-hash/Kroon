import { Injectable, NotFoundException } from '@nestjs/common';
import { DispatchStatus, WorkflowState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  async createOrder(
    campusId: string,
    studentItems: { studentId: string; uniformType: string; quantity: number }[],
    userId: string,
    meta?: { vehicleNo?: string; driverName?: string; notes?: string },
  ) {
    const order = await this.prisma.dispatchOrder.create({
      data: {
        campusId,
        createdById: userId,
        ...meta,
        items: {
          create: studentItems,
        },
      },
      include: {
        items: { include: { student: { select: { id: true, name: true, studentCode: true } } } },
        campus: { select: { id: true, name: true } },
      },
    });

    return order;
  }

  async findAll(campusId?: string) {
    return this.prisma.dispatchOrder.findMany({
      where: campusId ? { campusId } : undefined,
      include: {
        campus: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.dispatchOrder.findUnique({
      where: { id },
      include: {
        campus: true,
        items: {
          include: {
            student: { select: { id: true, name: true, studentCode: true, class: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Dispatch order not found');
    return order;
  }

  async updateStatus(id: string, status: DispatchStatus) {
    const order = await this.findOne(id);

    const data: Record<string, any> = { status };
    if (status === DispatchStatus.DISPATCHED) data.dispatchDate = new Date();
    if (status === DispatchStatus.DELIVERED) data.deliveryDate = new Date();

    const updated = await this.prisma.dispatchOrder.update({ where: { id }, data });

    if (status === DispatchStatus.DISPATCHED) {
      for (const item of order.items) {
        const workflow = await this.prisma.studentWorkflow.findUnique({
          where: { studentId: item.studentId },
        });
        if (workflow) {
          await this.prisma.$transaction([
            this.prisma.studentWorkflow.update({
              where: { studentId: item.studentId },
              data: { currentState: WorkflowState.DISPATCHED },
            }),
            this.prisma.workflowHistory.create({
              data: {
                workflowId: workflow.id,
                fromState: workflow.currentState,
                toState: WorkflowState.DISPATCHED,
                changedById: order.createdById,
              },
            }),
          ]);
        }
      }
    }

    return updated;
  }

  async markDelivered(orderId: string, studentId: string, receivedById: string) {
    await this.prisma.dispatchItem.updateMany({
      where: { dispatchOrderId: orderId, studentId },
      data: { receivedById, receivedAt: new Date() },
    });

    // Advance student workflow to DELIVERED
    const workflow = await this.prisma.studentWorkflow.findUnique({ where: { studentId } });
    if (workflow) {
      await this.prisma.$transaction([
        this.prisma.studentWorkflow.update({
          where: { studentId },
          data: { currentState: WorkflowState.DELIVERED },
        }),
        this.prisma.workflowHistory.create({
          data: {
            workflowId: workflow.id,
            fromState: workflow.currentState,
            toState: WorkflowState.DELIVERED,
            changedById: receivedById,
          },
        }),
      ]);
    }
  }
}
