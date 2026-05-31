'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { Scissors, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProductionPage() {
  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.tailorProductivity().then(setTailors).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Production</h1>
        <p className="text-sm text-gray-500 mt-1">Tailor assignments and stitching status</p>
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-3">Tailor Summary</h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tailors.length === 0 ? (
        <p className="text-sm text-gray-400">No tailors found. Add tailor users to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tailors.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {t.name[0]}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Completed', value: t.completed, icon: CheckCircle, color: 'text-green-600' },
                  { label: 'Pending', value: t.pending, icon: Clock, color: 'text-blue-600' },
                  { label: 'Reworks', value: t.reworks, icon: AlertCircle, color: 'text-red-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="text-center">
                    <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
