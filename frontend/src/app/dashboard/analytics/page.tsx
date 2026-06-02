'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  ResponsiveContainer, Legend,
} from 'recharts';
import { WORKFLOW_STATE_LABELS } from '@/lib/utils';
import type { WorkflowState } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function AnalyticsPage() {
  const [workflowDist, setWorkflowDist] = useState<{ state: WorkflowState; count: number }[]>([]);
  const [tailors, setTailors] = useState<any[]>([]);
  const [dispatchRate, setDispatchRate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.workflowDistribution(),
      analyticsApi.tailorProductivity(),
      analyticsApi.dispatchRate(),
    ]).then(([wd, tp, dr]) => {
      setWorkflowDist(wd);
      setTailors(tp);
      setDispatchRate(dr);
    }).finally(() => setLoading(false));
  }, []);

  const workflowChartData = workflowDist.map((d) => ({
    name: WORKFLOW_STATE_LABELS[d.state] || d.state,
    value: d.count,
  }));

  if (loading) return <p className="text-sm text-gray-400">Loading analytics…</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Workflow distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Student Workflow Distribution</h2>
          {workflowChartData.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={workflowChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {workflowChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dispatch rate */}
        {dispatchRate && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Dispatch & Delivery Rate</h2>
            <div className="space-y-4">
              {[
                { label: 'Dispatch Rate', value: dispatchRate.dispatchRate, color: 'bg-blue-500' },
                { label: 'Delivery Rate', value: dispatchRate.deliveryRate, color: 'bg-green-500' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-2 ${color} rounded-full`} style={{ width: `${Math.min(value, 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {[
                  { label: 'Total', value: dispatchRate.total },
                  { label: 'Dispatched', value: dispatchRate.dispatched },
                  { label: 'Delivered', value: dispatchRate.delivered },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tailor productivity */}
      {tailors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tailor Productivity</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tailors}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="pending" fill="#3b82f6" name="Pending" />
              <Bar dataKey="reworks" fill="#ef4444" name="Reworks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
