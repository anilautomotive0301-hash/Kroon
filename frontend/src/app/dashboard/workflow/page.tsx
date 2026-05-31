'use client';

import { useEffect, useState } from 'react';
import { workflowApi } from '@/lib/api';
import type { ApprovalRequest } from '@/types';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function WorkflowPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    workflowApi.pendingApprovals().then(setApprovals).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function review(workflowId: string, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED', notes?: string) {
    setProcessing(workflowId);
    try {
      await workflowApi.reviewApproval(workflowId, status, notes);
      await load();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">{approvals.length} pending size approvals</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{a.workflow?.student?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.workflow?.student?.campus?.name} · Class {a.workflow?.student?.class}
                    · Code: {a.workflow?.student?.studentCode}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Submitted by {a.requestedBy?.name} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => review(a.workflowId, 'REVISION_REQUESTED')}
                    disabled={processing === a.workflowId}
                    className="flex items-center gap-1.5 border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Revise
                  </button>
                  <button
                    onClick={() => review(a.workflowId, 'REJECTED')}
                    disabled={processing === a.workflowId}
                    className="flex items-center gap-1.5 border border-red-200 px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => review(a.workflowId, 'APPROVED')}
                    disabled={processing === a.workflowId}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
