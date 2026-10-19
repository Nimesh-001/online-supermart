import React, { useState, useEffect } from 'react';
import {
  Boxes,
  PackageCheck,
  PlusCircle,
  Zap,
  AlertTriangle,
  History,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Package,
  Layers,
  ShoppingBag,
  LogOut,
  ArrowLeft,
  BadgeAlert,
  SlidersHorizontal,
  Sparkles,
  Truck
} from 'lucide-react';
import OrdersTab from './admin/OrdersTab';

export default function OperationalManagerDashboard({ currentUser, onNavigateHome, onLogout }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'replenish' | 'lowstock' | 'movements' | 'concurrency'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    unresolvedAlertsCount: 0,
    totalStockMovements: 0
  });

  // Inventory & Stock State
  const [inventoryList, setInventoryList] = useState([]);
  const [lowStockReport, setLowStockReport] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Replenish Form State (sp_add_stock)
  const [replenishData, setReplenishData] = useState({
    productId: '1',
    quantity: '25',
    notes: 'Warehouse delivery restock batch'
  });
  const [replenishLoading, setReplenishLoading] = useState(false);

  // Concurrency Simulator State (sp_atomic_stock_decrement)
  const [decrementData, setDecrementData] = useState({
    productId: '1',
    quantity: '5'
  });
  const [decrementLoading, setDecrementLoading] = useState(false);
  const [concurrencyLogs, setConcurrencyLogs] = useState([]);

  // Toast Feedback
  const [feedback, setFeedback] = useState(null);

  const notify = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setStats(json.data);
      }
    } catch (e) {
      console.error('Stats error:', e);
    }
  };

  const fetchInventoryData = async () => {
    setLoadingInventory(true);
    try {
      const [invRes, lowRes, alertsRes, movRes] = await Promise.all([
        fetch('/api/inventory', { credentials: 'include' }),
        fetch('/api/inventory/low-stock', { credentials: 'include' }),
        fetch('/api/inventory/alerts', { credentials: 'include' }),
        fetch('/api/inventory/movements', { credentials: 'include' })
      ]);

      if (invRes.ok) {
        const json = await invRes.json();
        if (json.success && json.data) setInventoryList(json.data);
      }
      if (lowRes.ok) {
        const json = await lowRes.json();
        if (json.success && json.data) setLowStockReport(json.data);
      }
      if (alertsRes.ok) {
        const json = await alertsRes.json();
        if (json.success && json.data) setAlerts(json.data);
      }
      if (movRes.ok) {
        const json = await movRes.json();
        if (json.success && json.data) setMovements(json.data);
      }
    } catch (e) {
      notify('Failed to load inventory data.', true);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInventoryData();
  }, []);

  // Handle Stock Replenish via sp_add_stock
  const handleReplenish = async (e) => {
    e.preventDefault();
    if (!replenishData.productId || !replenishData.quantity) {
      notify('Please enter a product and restock quantity.', true);
      return;
    }

    setReplenishLoading(true);
    try {
      const res = await fetch('/api/inventory/replenish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: parseInt(replenishData.productId, 10),
          quantity: parseFloat(replenishData.quantity),
          notes: replenishData.notes
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        notify(`Stock replenished via sp_add_stock! New On-Hand: ${json.data.newQuantityOnHand}`);
        fetchInventoryData();
        fetchStats();
      } else {
        notify(json.message || 'Restock failed.', true);
      }
    } catch (err) {
      notify('Error replenishing stock.', true);
    } finally {
      setReplenishLoading(false);
    }
  };

  // Handle Concurrency Atomic Decrement via sp_atomic_stock_decrement
  const handleAtomicDecrement = async (e) => {
    e.preventDefault();
    setDecrementLoading(true);
    try {
      const res = await fetch('/api/inventory/atomic-decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: parseInt(decrementData.productId, 10),
          quantity: parseFloat(decrementData.quantity)
        })
      });

      const json = await res.json();
      const statusText = json.data?.status || (json.success ? 'SUCCESS' : 'FAILED');
      const logEntry = {
        time: new Date().toLocaleTimeString(),
        productId: decrementData.productId,
        qty: decrementData.quantity,
        status: statusText,
        message: json.message
      };

      setConcurrencyLogs((prev) => [logEntry, ...prev.slice(0, 9)]);
      if (statusText === 'SUCCESS') {
        notify(`Atomic stock decrement succeeded! Remaining: ${json.data.remainingQuantity}`);
        fetchInventoryData();
      } else {
        notify(`Stock decrement rolled back: ${statusText}`, true);
      }
    } catch (err) {
      notify('Network error executing atomic decrement.', true);
    } finally {
      setDecrementLoading(false);
    }
  };

  // Resolve Low Stock Alert
  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'PUT',
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        notify(`Alert #${alertId} marked as resolved.`);
        fetchInventoryData();
        fetchStats();
      }
    } catch (err) {
      notify('Failed to resolve alert.', true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in slide-in-from-bottom-5 ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.isError ? (
            <XCircle className="w-5 h-5 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-950 tracking-tight">SuperMart Operations</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 border border-teal-300 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Fulfillment & Warehouse
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Order Dispatch, Real-Time Stock Tracking & Procedure Restock (Members 3 & 5)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Storefront Link */}
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-teal-600" />
              <span>Back to Storefront</span>
            </button>

            {/* Current Manager Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span className="font-bold text-slate-800">
                {currentUser?.firstName || 'Manager'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono text-[10px] font-bold">
                OPERATIONAL_MANAGER
              </span>
            </div>

            {/* Logout Button */}
            <button
              id="manager-logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Order Fulfillment</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Stock Levels</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
              {inventoryList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('replenish')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'replenish'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Restock (sp_add_stock)</span>
          </button>

          <button
            onClick={() => setActiveTab('lowstock')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lowstock'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock & Alerts</span>
            {stats.unresolvedAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black text-[10px]">
                {stats.unresolvedAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'movements'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('concurrency')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'concurrency'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Concurrency Sandbox</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB 1: ORDER FULFILLMENT & OPERATIONS */}
        {activeTab === 'orders' && (
          <OrdersTab currentUser={currentUser} notify={notify} />
        )}

        {/* TAB 2: WAREHOUSE STOCK LEVELS */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Warehouse Inventory Registry</h3>
                <p className="text-xs text-slate-500">Evaluated in real-time via MySQL Stored Function <code>fn_get_stock_status</code>.</p>
              </div>
              <button
                onClick={fetchInventoryData}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInventory ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Selling Unit</th>
                    <th className="py-3 px-4 text-right">On-Hand Stock</th>
                    <th className="py-3 px-4 text-right">Min Threshold</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {inventoryList.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400">#{item.productId}</td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-900">{item.productName}</td>
                      <td className="py-3 px-4 uppercase text-slate-500">{item.sellingUnit}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{item.quantityOnHand}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{item.minThreshold}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.stockStatus === 'HEALTHY' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          item.stockStatus === 'LOW_STOCK' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {item.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STOCK RESTOCK VIA sp_add_stock */}
        {activeTab === 'replenish' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-teal-600" />
                <span>Restock Warehouse Inventory (Procedure: sp_add_stock)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Adds quantity to <code>inventory.stock_quantity</code> and creates a ledger record in <code>stock_movements</code>.
              </p>
            </div>

            <form onSubmit={handleReplenish} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Product</label>
                <select
                  value={replenishData.productId}
                  onChange={(e) => setReplenishData({ ...replenishData, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                >
                  <option value="1">1 - Fresh Strawberries (KG)</option>
                  <option value="2">2 - Organic Broccoli (KG)</option>
                  <option value="3">3 - Fresh Whole Milk (EACH)</option>
                  <option value="4">4 - Farm Eggs 12pk (EACH)</option>
                  <option value="5">5 - Cavendish Bananas (KG)</option>
                  <option value="6">6 - Vine-Ripened Roma Tomatoes (KG)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Restock Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={replenishData.quantity}
                  onChange={(e) => setReplenishData({ ...replenishData, quantity: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Notes / Supplier Batch</label>
                <input
                  type="text"
                  value={replenishData.notes}
                  onChange={(e) => setReplenishData({ ...replenishData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={replenishLoading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {replenishLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                <span>Execute Stored Procedure sp_add_stock</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: LOW STOCK ALERTS & REORDER DEFICITS (v_low_stock_report) */}
        {activeTab === 'lowstock' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Low-Stock Reorder Deficit Report (View: v_low_stock_report)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Identifies catalog items whose stock is at or below minimum replenishment thresholds.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">On-Hand</th>
                    <th className="py-3 px-4 text-right">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Reorder Deficit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {lowStockReport.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-sans">
                        All warehouse inventory is currently healthy above minimum thresholds!
                      </td>
                    </tr>
                  ) : (
                    lowStockReport.map((r) => (
                      <tr key={r.productId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{r.productName}</td>
                        <td className="py-3 px-4 font-sans text-slate-600">{r.categoryName}</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">{r.quantityOnHand}</td>
                        <td className="py-3 px-4 text-right text-slate-500">{r.minThreshold}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">
                          +{r.minThreshold - r.quantityOnHand} units
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Automated Alerts Stream (trg_check_low_stock) */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BadgeAlert className="w-4 h-4 text-rose-600" />
                <span>Automated Database Alerts (Trigger: trg_check_low_stock)</span>
              </h3>
              <div className="space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No open alerts.</p>
                ) : (
                  alerts.map((al) => (
                    <div key={al.alertId} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <span className="font-bold text-xs text-slate-900">Alert #{al.alertId}: {al.productName}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{al.alertMessage}</p>
                      </div>
                      {!al.resolved && (
                        <button
                          onClick={() => handleResolveAlert(al.alertId)}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 text-xs font-bold cursor-pointer"
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STOCK MOVEMENTS AUDIT LEDGER */}
        {activeTab === 'movements' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <span>Stock Movement Ledger (Table: stock_movements)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Audited transaction logs showing delta reasons: <code>RESTOCK</code>, <code>SALE</code>, <code>ADJUSTMENT</code>.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Movement ID</th>
                    <th className="py-3 px-4">Product ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Quantity Delta</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {movements.map((m) => (
                    <tr key={m.movementId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400">#{m.movementId}</td>
                      <td className="py-3 px-4 text-slate-700 font-bold">Product #{m.productId}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.movementType === 'STOCK_IN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          m.movementType === 'SALE' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${m.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{m.referenceType || 'SYSTEM'} #{m.referenceId || '-'}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">{m.notes || '—'}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-sans">{m.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CONCURRENCY DECREMENT SANDBOX (sp_atomic_stock_decrement) */}
        {activeTab === 'concurrency' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>Concurrency Decrement Sandbox (sp_atomic_stock_decrement)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pessimistic row lock (<code>FOR UPDATE</code>) with output status parameter to prevent overselling.
              </p>
            </div>

            <form onSubmit={handleAtomicDecrement} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product ID</label>
                  <select
                    value={decrementData.productId}
                    onChange={(e) => setDecrementData({ ...decrementData, productId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                  >
                    <option value="1">1 - Fresh Strawberries (KG)</option>
                    <option value="2">2 - Organic Broccoli (KG)</option>
                    <option value="3">3 - Fresh Whole Milk (EACH)</option>
                    <option value="4">4 - Farm Eggs 12pk (EACH)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Decrement</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={decrementData.quantity}
                    onChange={(e) => setDecrementData({ ...decrementData, quantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={decrementLoading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {decrementLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Execute Stored Procedure sp_atomic_stock_decrement</span>
              </button>
            </form>

            {/* Simulation Log Stream */}
            {concurrencyLogs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Recent Procedure Executions:</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {concurrencyLogs.map((lg, i) => (
                    <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      lg.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <span>[{lg.time}] Product #{lg.productId} ({lg.qty} units) &rarr; {lg.status}</span>
                      <span className="text-[10px] font-sans">{lg.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
