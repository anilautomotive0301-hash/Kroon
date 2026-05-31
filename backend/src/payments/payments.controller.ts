import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('student/:studentId')
  getStudentPayments(@Param('studentId') studentId: string) {
    return this.paymentsService.getStudentPayments(studentId);
  }

  @Post('student/:studentId')
  recordPayment(
    @Param('studentId') studentId: string,
    @Body() body: { amount: number; method: string; transactionId?: string; notes?: string },
  ) {
    return this.paymentsService.recordPayment(studentId, body.amount, body.method, body.transactionId, body.notes);
  }

  @Get('campus/:campusId/summary')
  getCampusSummary(@Param('campusId') campusId: string) {
    return this.paymentsService.getCampusPaymentSummary(campusId);
  }

  @Get('invoices')
  getInvoices(@Query('campusId') campusId?: string) {
    return this.paymentsService.getInvoices(campusId);
  }

  @Post('invoices')
  createInvoice(@Body() body: { campusId: string; amount: number; dueDate: string }) {
    return this.paymentsService.createInvoice(body.campusId, body.amount, body.dueDate);
  }

  @Patch('invoices/:id/paid')
  markInvoicePaid(@Param('id') id: string) {
    return this.paymentsService.markInvoicePaid(id);
  }
}
