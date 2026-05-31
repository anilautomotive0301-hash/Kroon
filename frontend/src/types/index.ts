export type Role = 'ADMIN' | 'SUPERVISOR' | 'FIELD_STAFF' | 'TAILOR' | 'ACCOUNTANT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type WorkflowState =
  | 'REGISTERED'
  | 'MEASUREMENT_PENDING'
  | 'MEASURED'
  | 'SIZE_ASSIGNED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'FABRIC_ALLOCATED'
  | 'TAILOR_ASSIGNED'
  | 'STITCHING'
  | 'QUALITY_CHECK'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'REWORK';

export type VisitStatus = 'SCHEDULED' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
export type StitchingStatus = 'PENDING' | 'IN_PROGRESS' | 'QUALITY_PENDING' | 'QUALITY_PASSED' | 'QUALITY_FAILED' | 'REWORK' | 'COMPLETED';
export type DispatchStatus = 'PENDING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'PARTIAL';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  createdAt: string;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  isActive: boolean;
  _count?: { students: number; visits: number };
}

export interface Student {
  id: string;
  campusId: string;
  studentCode: string;
  name: string;
  class: string;
  section?: string;
  gender: Gender;
  age?: number;
  parentName?: string;
  parentPhone?: string;
  qrCode?: string;
  campus?: Pick<Campus, 'id' | 'name'>;
  workflow?: { currentState: WorkflowState };
  sizeAssignment?: SizeAssignment;
}

export interface Measurement {
  id: string;
  studentId: string;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  sleeveLength?: number;
  shirtLength?: number;
  trouserLength?: number;
  inseam?: number;
  neck?: number;
  notes?: string;
  measuredBy?: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface SizeAssignment {
  id: string;
  studentId: string;
  shirtSize?: string;
  trouserSize?: string;
  blazerSize?: string;
  tieSize?: string;
  customNotes?: string;
  isCustom: boolean;
  assignedBy?: Pick<User, 'id' | 'name'>;
  approvedBy?: Pick<User, 'id' | 'name'>;
  approvedAt?: string;
  createdAt: string;
}

export interface StudentWorkflow {
  id: string;
  studentId: string;
  currentState: WorkflowState;
  history: WorkflowHistory[];
  approvalRequest?: ApprovalRequest;
}

export interface WorkflowHistory {
  id: string;
  fromState: WorkflowState;
  toState: WorkflowState;
  changedBy: Pick<User, 'id' | 'name'>;
  reason?: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  status: ApprovalStatus;
  requestedBy: Pick<User, 'id' | 'name'>;
  supervisor?: Pick<User, 'id' | 'name'>;
  notes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface FabricItem {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitPrice?: number;
  balance?: number;
}

export interface DashboardKpis {
  totalCampuses: number;
  totalStudents: number;
  pendingApprovals: number;
  inProduction: number;
  dispatched: number;
  delivered: number;
}
