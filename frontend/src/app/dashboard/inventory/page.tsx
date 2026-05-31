'use client';

import { useEffect, useState } from 'react';
import { inventoryApi } from '@/lib/api';
import type { FabricItem } from '@/types';
import { Package, Plus, TrendingDown, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<(FabricItem & { balance: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStock, setShowStock] = useState<string | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    inventoryApi.getFabricItems().then(setItems).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    if (!showStock) return;
    setSaving(true);
    try {
      await inventoryApi.addStock({
        fabricItemId: showStock,
        quantity: parseFloat(stockQty),
        supplierName: supplier || undefined,
      });
      await load();
      setShowStock(null);
      setStockQty('');
      setSupplier('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Fabric stock tracking</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.code}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${item.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.balance.toFixed(1)} {item.unit}
                </span>
              </div>

              {item.unitPrice && (
                <p className="text-xs text-gray-500 mb-3">₹{item.unitPrice}/{item.unit}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowStock(item.id)}
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Add Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showStock && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Add Stock Entry</h2>
            <form onSubmit={handleAddStock} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier (optional)</label>
                <input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStock(null)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
