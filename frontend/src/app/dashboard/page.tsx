'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import type { DashboardKpis } from '@/types';
import { Building2, CheckSquare, Package, Send, Scissors, Users } from 'lucide-react';

const KPI_CONFIG = [
  { key: 'totalCampuses', label: 'Campuses', icon: Building2, color: 'bg-blue-50 text-blue-600' },
  { key: 'totalStudents', label: 'Students', icon: Users, color: 'bg-indigo-50 text-indigo-600' },
  { key: 'pendingApprovals', label: 'Pending Approvals', icon: CheckSquare, color: 'bg-orange-50 text-orange-600' },
  { key: 'inProduction', label: 'In Production', icon: Scissors, color: 'bg-purple-50 text-purple-600' },
  { key: 'dispatched', label: 'Dispatched', icon: Send, color: 'bg-teal-50 text-teal-600' },
  { key: 'delivered', label: 'Delivered', icon: Package, color: 'bg-green-50 text-green-600' },
] as const;

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.kpis().then(setKpis).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">School uniform production dashboard</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {KPI_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '—' : kpis?.[key] ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Production Pipeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            'Campus Registration',
            'Student Import',
            'Measurement',
            'Size Assignment',
            'Approval',
            'Fabric Planning',
            'Tailor Assignment',
            'Stitching',
            'Quality Check',
            'Dispatch',
            'Delivery',
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md whitespace-nowrap">
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-gray-300 text-sm">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
