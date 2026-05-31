import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApprovalStatus, Role, WorkflowState } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { WorkflowService } from './workflow.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get('student/:studentId')
  getStudentWorkflow(@Param('studentId') studentId: string) {
    return this.workflowService.getStudentWorkflow(studentId);
  }

  @Post('student/:studentId/transition')
  transition(
    @Param('studentId') studentId: string,
    @Body('toState') toState: WorkflowState,
    @Body('reason') reason: string,
    @GetUser('id') userId: string,
  ) {
    return this.workflowService.transition(studentId, toState, userId, reason);
  }

  @Post('student/:studentId/submit-approval')
  submitForApproval(
    @Param('studentId') studentId: string,
    @GetUser('id') userId: string,
  ) {
    return this.workflowService.submitForApproval(studentId, userId);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('approvals/:workflowId/review')
  reviewApproval(
    @Param('workflowId') workflowId: string,
    @Body('status') status: ApprovalStatus,
    @Body('notes') notes: string,
    @GetUser('id') supervisorId: string,
  ) {
    return this.workflowService.reviewApproval(workflowId, supervisorId, status, notes);
  }

  @Get('approvals/pending')
  getPendingApprovals() {
    return this.workflowService.getPendingApprovals();
  }

  @Get('campus/:campusId')
  getByCampusState(
    @Param('campusId') campusId: string,
    @Query('state') state?: WorkflowState,
  ) {
    return this.workflowService.getByCampusState(campusId, state);
  }
}
