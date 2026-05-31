import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getStudentPayments(studentId: string) {
    return this.prisma.payment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(studentId: string, amount: number, method: string, transactionId?: string, notes?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.payment.create({
      data: { studentId, amount, method, transactionId, notes, status: PaymentStatus.PAID, paidAt: new Date() },
    });
  }

  async getCampusPaymentSummary(campusId: string) {
    const students = await this.prisma.student.findMany({
      where: { campusId },
      include: { payments: true },
    });

    return students.map((s) => {
      const totalPaid = s.payments
        .filter((p) => p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        studentId: s.id,
        name: s.name,
        studentCode: s.studentCode,
        totalPaid,
        payments: s.payments,
      };
    });
  }

  async getInvoices(campusId?: string) {
    return this.prisma.schoolInvoice.findMany({
      where: campusId ? { campusId } : undefined,
      include: { campus: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvoice(campusId: string, amount: number, dueDate: string) {
    const campus = await this.prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) throw new NotFoundException('Campus not found');

    const invoiceNo = `INV-${campus.code}-${Date.now()}`;
    return this.prisma.schoolInvoice.create({
      data: { campusId, invoiceNo, amount, dueDate: new Date(dueDate) },
    });
  }

  async markInvoicePaid(invoiceId: string) {
    return this.prisma.schoolInvoice.update({
      where: { id: invoiceId },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });
  }
}
