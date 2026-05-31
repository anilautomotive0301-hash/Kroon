'use client';

import { useEffect, useState } from 'react';
import { campusApi } from '@/lib/api';
import type { Campus } from '@/types';
import { Send, Package } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PACKED: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
};

export default function DispatchPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);

  useEffect(() => {
    campusApi.list().then(setCampuses);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch</h1>
          <p className="text-sm text-gray-500 mt-1">Manage uniform dispatch orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <Send className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Select a campus and mark students ready for dispatch</p>
        <p className="text-xs text-gray-400 mt-1">
          Only students in <span className="font-medium">QUALITY_CHECK passed</span> state can be dispatched
        </p>
      </div>
    </div>
  );
}
