'use client';

import { useEffect, useRef, useState } from 'react';
import { studentsApi, measurementsApi } from '@/lib/api';
import type { Student } from '@/types';
import { Search, Save, X, User } from 'lucide-react';

const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest (cm)' },
  { key: 'waist', label: 'Waist (cm)' },
  { key: 'hip', label: 'Hip (cm)' },
  { key: 'shoulder', label: 'Shoulder (cm)' },
  { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
  { key: 'shirtLength', label: 'Shirt Length (cm)' },
  { key: 'trouserLength', label: 'Trouser Length (cm)' },
  { key: 'inseam', label: 'Inseam (cm)' },
  { key: 'neck', label: 'Neck (cm)' },
] as const;

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44'];

export default function MeasurementsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [sizes, setSizes] = useState({ shirtSize: '', trouserSize: '', blazerSize: '' });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastRecordedBy, setLastRecordedBy] = useState<string | null>(null);
  const [lastRecordedAt, setLastRecordedAt] = useState<string | null>(null);
  const [sizeAssignedBy, setSizeAssignedBy] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      studentsApi
        .list({ search: query.trim(), limit: 10 })
        .then((res) => {
          setResults(res.students || []);
          setShowDropdown(true);
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function selectStudent(s: Student) {
    setStudent(s);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setSaved(false);
    setLastRecordedBy(null);
    setLastRecordedAt(null);
    setSizeAssignedBy(null);

    // Load existing measurements & size assignment so all roles can see each other's entries
    setLoadingExisting(true);
    try {
      const [measurementList, sizeData] = await Promise.all([
        measurementsApi.getForStudent(s.id).catch(() => []),
        measurementsApi.getSizeAssignment(s.id).catch(() => null),
      ]);

      // Pre-populate form with the most recent measurement
      if (Array.isArray(measurementList) && measurementList.length > 0) {
        const latest = measurementList[0];
        const prefilled: Record<string, string> = {};
        for (const field of MEASUREMENT_FIELDS) {
          if (latest[field.key] != null) prefilled[field.key] = String(latest[field.key]);
        }
        setMeasurements(prefilled);
        setNotes(latest.notes || '');
        setLastRecordedBy(latest.measuredBy?.name || null);
        setLastRecordedAt(latest.createdAt || null);
      } else {
        setMeasurements({});
        setNotes('');
      }

      // Pre-populate sizes
      if (sizeData) {
        setSizes({
          shirtSize: sizeData.shirtSize || '',
          trouserSize: sizeData.trouserSize || '',
          blazerSize: sizeData.blazerSize || '',
        });
        setSizeAssignedBy(sizeData.assignedBy?.name || null);
      } else {
        setSizes({ shirtSize: '', trouserSize: '', blazerSize: '' });
      }
    } finally {
      setLoadingExisting(false);
    }
  }

  function clearStudent() {
    setStudent(null);
    setMeasurements({});
    setSizes({ shirtSize: '', trouserSize: '', blazerSize: '' });
    setNotes('');
    setSaved(false);
    setLastRecordedBy(null);
    setLastRecordedAt(null);
    setSizeAssignedBy(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    try {
      const measurementData: Record<string, any> = { studentId: student.id, notes: notes || undefined };
      for (const field of MEASUREMENT_FIELDS) {
        if (measurements[field.key]) measurementData[field.key] = parseFloat(measurements[field.key]);
      }
      await measurementsApi.record(measurementData);

      if (sizes.shirtSize || sizes.trouserSize || sizes.blazerSize) {
        await measurementsApi.assignSize({ studentId: student.id, ...sizes });
      }

      setSaved(true);
      setStudent(null);
      setMeasurements({});
      setSizes({ shirtSize: '', trouserSize: '', blazerSize: '' });
      setNotes('');
      setLastRecordedBy(null);
      setLastRecordedAt(null);
      setSizeAssignedBy(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record Measurements</h1>
        <p className="text-sm text-gray-500 mt-1">Search student by name or student code</p>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200">
          Measurements saved successfully.
        </div>
      )}

      {!student && (
        <div ref={searchRef} className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="Search by student name or code (e.g. STU001, John…)"
              className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>
            )}
          </div>

          {showDropdown && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectStudent(s)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.studentCode} · {(s as any).campus?.name} · Class {s.class}{s.section ? `-${s.section}` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}

          {showDropdown && !searching && results.length === 0 && query.trim() && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-500">
              No students found for "{query}"
            </div>
          )}
        </div>
      )}

      {student && (
        <>
          {loadingExisting ? (
            <div className="text-sm text-gray-400 py-8 text-center">Loading existing data…</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Student card */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-blue-900">{student.name}</p>
                  <p className="text-sm text-blue-700">
                    {(student as any).campus?.name} · Class {student.class}
                    {student.section ? `-${student.section}` : ''} · {student.studentCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearStudent}
                  className="text-blue-400 hover:text-blue-600 ml-3"
                  title="Change student"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Previously recorded by banner */}
              {lastRecordedBy && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Last recorded by <span className="font-medium text-gray-700">{lastRecordedBy}</span>
                    {lastRecordedAt && (
                      <> on {new Date(lastRecordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                    {sizeAssignedBy && sizeAssignedBy !== lastRecordedBy && (
                      <> · Sizes assigned by <span className="font-medium text-gray-700">{sizeAssignedBy}</span></>
                    )}
                  </span>
                </div>
              )}

              {/* Body measurements */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Body Measurements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {MEASUREMENT_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={measurements[key] || ''}
                        onChange={(e) => setMeasurements({ ...measurements, [key]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Size assignment */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Size Assignment</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'shirtSize' as const, label: 'Shirt Size' },
                    { key: 'trouserSize' as const, label: 'Trouser Size' },
                    { key: 'blazerSize' as const, label: 'Blazer Size' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <select
                        value={sizes[key]}
                        onChange={(e) => setSizes({ ...sizes, [key]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="">— Select —</option>
                        {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Measurement'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
