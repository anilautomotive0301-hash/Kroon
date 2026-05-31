import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { WorkflowState } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  REGISTERED: 'Registered',
  MEASUREMENT_PENDING: 'Measurement Pending',
  MEASURED: 'Measured',
  SIZE_ASSIGNED: 'Size Assigned',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  FABRIC_ALLOCATED: 'Fabric Allocated',
  TAILOR_ASSIGNED: 'Tailor Assigned',
  STITCHING: 'Stitching',
  QUALITY_CHECK: 'Quality Check',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  REWORK: 'Rework',
};

export const WORKFLOW_STATE_COLORS: Record<WorkflowState, string> = {
  REGISTERED: 'bg-gray-100 text-gray-700',
  MEASUREMENT_PENDING: 'bg-yellow-100 text-yellow-700',
  MEASURED: 'bg-blue-100 text-blue-700',
  SIZE_ASSIGNED: 'bg-purple-100 text-purple-700',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  FABRIC_ALLOCATED: 'bg-teal-100 text-teal-700',
  TAILOR_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  STITCHING: 'bg-cyan-100 text-cyan-700',
  QUALITY_CHECK: 'bg-lime-100 text-lime-700',
  DISPATCHED: 'bg-emerald-100 text-emerald-700',
  DELIVERED: 'bg-green-200 text-green-800',
  REWORK: 'bg-red-100 text-red-700',
};

export const WORKFLOW_STEPS: WorkflowState[] = [
  'REGISTERED',
  'MEASUREMENT_PENDING',
  'MEASURED',
  'SIZE_ASSIGNED',
  'PENDING_APPROVAL',
  'APPROVED',
  'FABRIC_ALLOCATED',
  'TAILOR_ASSIGNED',
  'STITCHING',
  'QUALITY_CHECK',
  'DISPATCHED',
  'DELIVERED',
];
