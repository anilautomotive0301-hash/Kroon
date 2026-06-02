'use client';

import { useState } from 'react';
import { studentsApi, measurementsApi } from '@/lib/api';
import type { Student } from '@/types';
import { QrCode, Save } from 'lucide-react';

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
  const [qrInput, setQrInput] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [sizes, setSizes] = useState({ shirtSize: '', trouserSize: '', blazerSize: '' });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setNotFound(false);
    setStudent(null);
    setSaved(false);
    try {
      const s = await studentsApi.findByQr(qrInput.trim());
      setStudent(s);
    } catch {
      setNotFound(true);
    }
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
      setQrInput('');
      setMeasurements({});
      setSizes({ shirtSize: '', trouserSize: '', blazerSize: '' });
      setNotes('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record Measurements</h1>
        <p className="text-sm text-gray-500 mt-1">Scan student QR code or enter it manually</p>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200">
          Measurements saved successfully.
        </div>
      )}

      <form onSubmit={handleScan} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Scan or type student QR code (e.g. KRN-ABCD1234)"
            className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Find
        </button>
      </form>

      {notFound && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          Student not found for QR code: {qrInput}
        </div>
      )}

      {student && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="font-semibold text-blue-900">{student.name}</p>
            <p className="text-sm text-blue-700">
              {(student as any).campus?.name} · Class {student.class}
              {student.section ? `-${student.section}` : ''} · {student.studentCode}
            </p>
          </div>

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
    </div>
  );
}
