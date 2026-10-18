import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  History, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  PlusCircle,
  Activity
} from 'lucide-react';

export default function WarehouseInventoryModal({ onClose, onStockUpdated }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'replenish', 'alerts', 'movements'
  const [inventoryList, setInventoryList] = useState([]);
  const [lowStockReport, setLowStockReport] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [replenishQty, setReplenishQty] = useState('');
  const [replenishNotes, setReplenishNotes] = useState('Scheduled warehouse shipment');
  const [submittingReplenish, setSubmittingReplenish] = useState(false);

  // Concurrency tester state
  const [decrementProductId, setDecrementProductId] = useState('');
  const [decrementQty, setDecrementQty] = useState('5');
  const [decrementResult, setDecrementResult] = useState(null);
  const [submittingDecrement, setSubmittingDecrement] = useState(false);

  const fetchAllInventoryData = async () => {
    setLoading(true);
    try {
      const [invRes, lowRes, alertRes, movRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/low-stock'),
        fetch('/api/inventory/alerts'),
        fetch('/api/inventory/movements?limit=20'),
      ]);

      if (invRes.ok) {
        const d = await invRes.json();
        setInventoryList(d.data || []);
        if (d.data && d.data.length > 0 && !selectedProductId) {
          setSelectedProductId(d.data[0].productId);
          setDecrementProductId(d.data[0].productId);
        }
      }

      if (lowRes.ok) {
        const d = await lowRes.json();
        setLowStockReport(d.data || []);
      }

      if (alertRes.ok) {
        const d = await alertRes.json();
        setAlerts(d.data || []);
      }

      if (movRes.ok) {
        const d = await movRes.json();
        setMovements(d.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInventoryData();
  }, []);

  const handleReplenishSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !replenishQty || parseFloat(replenishQty) <= 0) return;

    setSubmittingReplenish(true);
    setActionFeedback(null);

    try {
      const response = await fetch('/api/inventory/replenish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(selectedProductId, 10),
          quantity: parseFloat(replenishQty),
          actorId: 1,
          notes: replenishNotes || 'Warehouse stock replenishment',
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: `Successfully added ${replenishQty} stock via stored procedure sp_add_stock!`,
        });
        setReplenishQty('');
        await fetchAllInventoryData();
        if (onStockUpdated) onStockUpdated();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.message || 'Failed to replenish stock.',
        });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: 'Network error executing sp_add_stock.' });
    } finally {
      setSubmittingReplenish(false);
    }
  };

  const handleAtomicDecrementTest = async () => {
    if (!decrementProductId || !decrementQty || parseFloat(decrementQty) <= 0) return;

    setSubmittingDecrement(true);
    setDecrementResult(null);

    try {
      const response = await fetch('/api/inventory/atomic-decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(decrementProductId, 10),
          deductQuantity: parseFloat(decrementQty),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDecrementResult(data.data);
        await fetchAllInventoryData();
        if (onStockUpdated) onStockUpdated();
      }
    } catch (err) {
      console.error('Atomic decrement error:', err);
    } finally {
      setSubmittingDecrement(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });
      if (response.ok) {
        await fetchAllInventoryData();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider">
                  Member 3: Inventory Architecture
                </span>
                <span className="text-xs text-slate-500 font-semibold">Real-Time Stock & Autonomous Alerting</span>
              </div>
              <h2 className="text-xl font-black text-slate-950 mt-0.5">Warehouse Inventory & Stock Operations</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Notification Feedback */}
        {actionFeedback && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center justify-between ${
            actionFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <span>{actionFeedback.text}</span>
            <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'inventory' 
                ? 'border-emerald-600 text-emerald-800' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Stock Levels ({inventoryList.length})
          </button>

          <button
            onClick={() => setActiveTab('replenish')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'replenish' 
                ? 'border-emerald-600 text-emerald-800' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Stock Replenishment (sp_add_stock)</span>
          </button>

          <button
            onClick={() => setActiveTab('concurrency')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'concurrency' 
                ? 'border-emerald-600 text-emerald-800' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Atomic Lock Decrement</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alerts' 
                ? 'border-emerald-600 text-emerald-800' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Alerts & Reorder View ({lowStockReport.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'movements' 
                ? 'border-emerald-600 text-emerald-800' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movements Ledger ({movements.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Querying MySQL inventory records & views...</p>
            </div>
          ) : activeTab === 'inventory' ? (
            /* Tab 1: Real-time stock levels table */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Current Warehouse Inventory</h3>
                  <p className="text-xs text-slate-500">Status determined via database function <code className="text-emerald-700 font-mono">fn_get_stock_status</code></p>
                </div>
                <button
                  onClick={fetchAllInventoryData}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Unit</th>
                      <th className="py-3 px-3 text-right">In Stock</th>
                      <th className="py-3 px-3 text-right">Reorder Threshold</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {inventoryList.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.productName}</td>
                        <td className="py-3 px-3 text-slate-500">{item.categoryName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.sellingUnit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {Number(item.stockQuantity).toFixed(item.sellingUnit === 'KG' ? 2 : 0)} {item.sellingUnit === 'KG' ? 'kg' : 'units'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {Number(item.lowStockThreshold).toFixed(item.sellingUnit === 'KG' ? 2 : 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            item.stockStatus === 'IN_STOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.stockStatus === 'LOW_STOCK'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.stockStatus === 'IN_STOCK' ? '✓ In Stock' : item.stockStatus === 'LOW_STOCK' ? '⚠️ Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'replenish' ? (
            /* Tab 2: Stock Replenishment calling sp_add_stock */
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Transactional Replenishment Procedure</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Executing replenishment calls MySQL stored procedure <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-900 font-bold">sp_add_stock(p_product_id, p_qty, p_actor_id)</code>. 
                  It locks the row with <code className="font-mono">FOR UPDATE</code>, updates available inventory, and inserts a ledger record into <code className="font-mono">stock_movements</code>.
                </p>
              </div>

              <form onSubmit={handleReplenishSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Product to Receive:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                  >
                    {inventoryList.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        #{p.productId} - {p.productName} (Current: {p.stockQuantity} {p.sellingUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Received Quantity:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={replenishQty}
                    onChange={(e) => setReplenishQty(e.target.value)}
                    placeholder="e.g. 50 (units or kg)"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Movement Ledger Notes:
                  </label>
                  <input
                    type="text"
                    value={replenishNotes}
                    onChange={(e) => setReplenishNotes(e.target.value)}
                    placeholder="e.g. Weekly farm truck batch delivery"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReplenish}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submittingReplenish ? 'Processing Transaction...' : 'Commit Stock Replenishment (sp_add_stock)'}</span>
                </button>
              </form>
            </div>
          ) : activeTab === 'concurrency' ? (
            /* Tab 3: Atomic Stock Decrement Demonstration */
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Pessimistic Concurrency Decrement</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Calls stored procedure <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-900 font-bold">sp_atomic_stock_decrement(p_product_id, p_deduct_qty, OUT p_is_success)</code>. 
                  Demonstrates ADBMS concurrency control: if requested stock is available, it acquires row lock, deducts, and commits. If insufficient, it cleanly executes <code className="font-mono">ROLLBACK</code> and returns false without overselling!
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Product to Decrement:
                  </label>
                  <select
                    value={decrementProductId}
                    onChange={(e) => setDecrementProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-medium"
                  >
                    {inventoryList.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        #{p.productId} - {p.productName} (Current Stock: {p.stockQuantity} {p.sellingUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Deduct Quantity (Try an excess like 99999 to test rollback):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={decrementQty}
                    onChange={(e) => setDecrementQty(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={handleAtomicDecrementTest}
                    disabled={submittingDecrement}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Activity className="w-4 h-4" />
                    <span>{submittingDecrement ? 'Running Concurrency Lock...' : 'Execute sp_atomic_stock_decrement'}</span>
                  </button>
                </div>

                {decrementResult && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    decrementResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {decrementResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{decrementResult.success ? 'Transaction Committed' : 'Transaction Rolled Back (Protected Against Overselling)'}</span>
                    </div>
                    <p>{decrementResult.message}</p>
                    <p className="font-mono text-[11px] text-slate-600">Remaining stock on database: {decrementResult.remainingStock}</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'alerts' ? (
            /* Tab 4: Low Stock Report View and Autonomous Trigger Alerts */
            <div className="space-y-6">
              {/* View Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Direct Projection from Database View: <code className="text-emerald-700 font-mono">v_low_stock_report</code></h3>
                    <p className="text-xs text-slate-500">Products currently at or below their reorder threshold</p>
                  </div>
                </div>

                {lowStockReport.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                    ✓ All inventory levels are healthy! Zero products currently below threshold in <code className="font-mono font-bold">v_low_stock_report</code>.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Product</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3 text-right">Current Stock</th>
                          <th className="py-2.5 px-3 text-right">Threshold</th>
                          <th className="py-2.5 px-3 text-right">Deficit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {lowStockReport.map((r) => (
                          <tr key={r.productId} className="bg-rose-50/50">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{r.productName}</td>
                            <td className="py-2.5 px-3 text-slate-600">{r.categoryName}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">{r.stockQuantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">{r.lowStockThreshold}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">-{r.deficit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Trigger Alerts Section */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Autonomous Trigger Alerts (<code className="text-emerald-700 font-mono">trg_check_low_stock</code>)
                </h3>
                <p className="text-xs text-slate-500 mb-3">When stock quantity updates below threshold, MySQL trigger automatically creates tickets in <code className="font-mono">low_stock_alerts</code>.</p>

                {alerts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    No active trigger alerts logged yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {alerts.map((a) => (
                      <div key={a.alertId} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.alertStatus === 'OPEN' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {a.alertStatus}
                            </span>
                            <span className="font-bold text-slate-900">Alert #{a.alertId} — {a.productName}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Stock dropped to {a.stockQuantity} (Threshold: {a.thresholdQuantity}) • {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                          </p>
                        </div>
                        {a.alertStatus === 'OPEN' && (
                          <button
                            onClick={() => handleResolveAlert(a.alertId)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 5: Stock Movements Audit Ledger */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Stock Movement Audit Ledger (<code className="text-emerald-700 font-mono">stock_movements</code>)</h3>
                  <p className="text-xs text-slate-500">Immutable ledger recording all incoming shipments, customer sales, and adjustments</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3 text-right">Change</th>
                      <th className="py-3 px-4">Actor / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {movements.map((m) => {
                      const isPositive = m.quantityChange > 0;
                      return (
                        <tr key={m.movementId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{m.productName}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.movementType === 'STOCK_IN' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : m.movementType === 'SALE'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {m.movementType}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                            <span className="font-semibold text-slate-800">{m.actorName}</span>
                            {m.notes && <span className="block text-[10px] text-slate-400">{m.notes}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">
            Member 3: <code className="text-emerald-700 font-bold font-mono">v_low_stock_report</code> • <code className="text-emerald-700 font-bold font-mono">sp_add_stock</code> • <code className="text-emerald-700 font-bold font-mono">sp_atomic_stock_decrement</code> • <code className="text-emerald-700 font-bold font-mono">trg_check_low_stock</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
