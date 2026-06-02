'use client';

import { useEffect, useState } from 'react';
import { campusApi, paymentsApi } from '@/lib/api';
import type { Campus } from '@/types';
import { ShoppingBag } from 'lucide-react';

export default function PaymentsPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState('');
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    campusApi.list().then(setCampuses);
  }, []);

  useEffect(() => {
    if (!campusId) return;
    setLoading(true);
    paymentsApi.getCampusSummary(campusId)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [campusId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Student payment tracking and school invoices</p>
      </div>

      <select
        value={campusId}
        onChange={(e) => setCampusId(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none mb-5"
      >
        <option value="">Select Campus</option>
        {campuses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {!campusId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select a campus to view payment summary</p>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Student', 'Total Paid', 'Transactions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No payment data</td></tr>
              ) : summary.map((row) => (
                <tr key={row.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.studentCode}</td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">₹{row.totalPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{row.payments.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
