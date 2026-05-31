'use client';

import { useEffect, useState } from 'react';
import { campusApi, studentsApi } from '@/lib/api';
import type { Campus, Student } from '@/types';
import { WORKFLOW_STATE_COLORS, WORKFLOW_STATE_LABELS } from '@/lib/utils';
import Link from 'next/link';
import { Upload, UserPlus } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    campusApi.list().then(setCampuses);
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      studentsApi
        .list({ campusId: campusId || undefined, search: search || undefined, page, limit: 50 })
        .then((res) => {
          setStudents(res.students);
          setTotal(res.total);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [campusId, search, page]);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !campusId) return;
    setImporting(true);
    try {
      await studentsApi.bulkImport(campusId, file);
      studentsApi.list({ campusId, page: 1, limit: 50 }).then((res) => {
        setStudents(res.students);
        setTotal(res.total);
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{total} students total</p>
        </div>
        <div className="flex gap-2">
          <label className={`flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-50 ${!campusId ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import CSV/Excel'}
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              disabled={!campusId || importing}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={campusId}
          onChange={(e) => { setCampusId(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, code…"
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Code', 'Name', 'Class', 'Gender', 'Campus', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No students found</td></tr>
            ) : students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.studentCode}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/students/${s.id}`} className="font-medium text-blue-600 hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.class}{s.section ? `-${s.section}` : ''}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{s.gender.toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600">{s.campus?.name || '—'}</td>
                <td className="px-4 py-3">
                  {s.workflow ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WORKFLOW_STATE_COLORS[s.workflow.currentState]}`}>
                      {WORKFLOW_STATE_LABELS[s.workflow.currentState]}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 50 >= total}
                className="px-3 py-1 border border-gray-200 rounded text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
