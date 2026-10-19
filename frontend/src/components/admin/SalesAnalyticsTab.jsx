import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  BarChart3, 
  Clock, 
  FileSpreadsheet, 
  Sparkles,
  ArrowUpRight,
  Users,
  Package
} from 'lucide-react';

export default function SalesAnalyticsTab({ currentUser, notify }) {
  const [kpis, setKpis] = useState(null);
  const [salesSummaries, setSalesSummaries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Daily Revenue Calculator state (fn_get_daily_revenue)
  const [calcDate, setCalcDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculatedRevenue, setCalculatedRevenue] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Reconciliation Procedure state (sp_daily_sales_summary)
  const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [kpiRes, salesRes] = await Promise.all([
        fetch('/api/analytics/executive-kpis', { credentials: 'include' }),
        fetch('/api/analytics/sales-overview', { credentials: 'include' })
      ]);

      if (kpiRes.ok) {
        const kpiJson = await kpiRes.json();
        if (kpiJson.success && kpiJson.data) setKpis(kpiJson.data);
      }
      if (salesRes.ok) {
        const salesJson = await salesRes.json();
        if (salesJson.success && salesJson.data) setSalesSummaries(salesJson.data);
      }
    } catch (e) {
      notify('Failed to load executive analytics data.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Execute fn_get_daily_revenue
  const handleCalculateDailyRevenue = async () => {
    setCalcLoading(true);
    try {
      const res = await fetch(`/api/analytics/daily-revenue?date=${encodeURIComponent(calcDate)}`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setCalculatedRevenue(json.data.revenue);
        notify(`Calculated revenue for ${calcDate}: LKR ${json.data.revenue}`);
      } else {
        notify('Failed to fetch daily revenue.', true);
      }
    } catch (e) {
      notify('Error invoking fn_get_daily_revenue.', true);
    } finally {
      setCalcLoading(false);
    }
  };

  // Execute sp_daily_sales_summary
  const handleRunReconciliation = async () => {
    setReconcileLoading(true);
    setReconcileResult(null);
    try {
      const res = await fetch(`/api/analytics/reconcile?date=${encodeURIComponent(reconcileDate)}`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReconcileResult(json.data);
        notify(`Sales reconciled for date ${reconcileDate} via sp_daily_sales_summary!`);
        fetchAnalyticsData();
      } else {
        notify(json.message || 'Reconciliation procedure failed.', true);
      }
    } catch (e) {
      notify('Error running reconciliation batch.', true);
    } finally {
      setReconcileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Executive Sales Analytics & Daily Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-500">
            Powered by View <code>v_admin_sales_overview</code>, Function <code>fn_get_daily_revenue</code>, and Procedure <code>sp_daily_sales_summary</code>.
          </p>
        </div>

        <button
          onClick={fetchAnalyticsData}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Strip */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Net Revenue</span>
            <div className="text-2xl font-black text-emerald-700">
              LKR {kpis.totalNetRevenue?.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">From completed & confirmed orders</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Sales</span>
            <div className="text-2xl font-black text-slate-900">
              LKR {kpis.totalGrossRevenue?.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Before discounts & delivery fees</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Orders</span>
            <div className="text-2xl font-black text-teal-700">
              {kpis.completedOrders} <span className="text-sm font-normal text-slate-400">/ {kpis.totalOrders} total</span>
            </div>
            <span className="text-[10px] text-slate-500">Fulfilled customer orders</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered Customers</span>
            <div className="text-2xl font-black text-blue-700">
              {kpis.totalCustomers}
            </div>
            <span className="text-[10px] text-slate-500">Active shopping accounts</span>
          </div>
        </div>
      )}

      {/* Interactive ADBMS Stored Function & Procedure Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tool 1: Stored Function fn_get_daily_revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Function: fn_get_daily_revenue</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              STORED FUNCTION
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Dynamically executes <code>fn_get_daily_revenue(date)</code> to pull net sales for a target business day.
          </p>

          <div className="flex gap-2">
            <input
              type="date"
              value={calcDate}
              onChange={(e) => setCalcDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-600 flex-1"
            />
            <button
              disabled={calcLoading}
              onClick={handleCalculateDailyRevenue}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {calcLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Fetch Revenue
            </button>
          </div>

          {calculatedRevenue !== null && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">Calculated Net Sales:</span>
              <span className="text-sm font-mono font-black text-emerald-700">
                LKR {Number(calculatedRevenue).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Tool 2: Stored Procedure sp_daily_sales_summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Procedure: sp_daily_sales_summary</span>
            </span>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
              RECONCILIATION BATCH
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Executes multi-table aggregation batch into <code>daily_sales_summaries</code> with duplicate key update.
          </p>

          <div className="flex gap-2">
            <input
              type="date"
              value={reconcileDate}
              onChange={(e) => setReconcileDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-600 flex-1"
            />
            <button
              disabled={reconcileLoading}
              onClick={handleRunReconciliation}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {reconcileLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Reconcile Batch
            </button>
          </div>

          {reconcileResult && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 font-mono">
              Status: {reconcileResult.status} for date {reconcileResult.reconciledDate} via {reconcileResult.triggeredByProcedure}
            </div>
          )}
        </div>

      </div>

      {/* Daily Sales Summaries Table (View v_admin_sales_overview) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Daily Sales Summaries Registry (View: <code>v_admin_sales_overview</code>)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Midnight Scheduler: <code>evt_midnight_sales_summary</code>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Summary Date</th>
                <th className="py-3 px-4 text-center">Completed Orders</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-4 text-right">Discounts Total</th>
                <th className="py-3 px-4 text-right">Net Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {salesSummaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No sales summaries recorded yet. Run a reconciliation batch above to aggregate daily sales!
                  </td>
                </tr>
              ) : (
                salesSummaries.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {s.summaryDate}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-teal-700">
                      {s.completedOrderCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      LKR {s.grossSales?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                      -LKR {s.discountsTotal?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      LKR {s.netSales?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
