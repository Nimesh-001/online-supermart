import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Boxes,
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
  Building,
  TrendingUp,
  Package,
  Layers,
  ShoppingBag,
  LogOut,
  ArrowLeft,
  Eye,
  Key,
  BadgeAlert,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard({ currentUser, onNavigateHome, onLogout }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'inventory' | 'replenish' | 'concurrency' | 'lowstock' | 'movements'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    unresolvedAlertsCount: 0,
    totalStockMovements: 0
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    roleName: 'OPERATIONAL_MANAGER',
    accountStatus: 'ACTIVE'
  });
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userFormError, setUserFormError] = useState(null);

  // Inventory & Stock State (Member 3)
  const [inventoryList, setInventoryList] = useState([]);
  const [lowStockReport, setLowStockReport] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Replenish Form State
  const [replenishData, setReplenishData] = useState({
    productId: '',
    quantity: '',
    notes: 'Warehouse delivery restock batch'
  });
  const [replenishLoading, setReplenishLoading] = useState(false);

  // Concurrency Simulator State
  const [decrementData, setDecrementData] = useState({
    productId: '',
    quantity: ''
  });
  const [decrementLoading, setDecrementLoading] = useState(false);
  const [concurrencyLogs, setConcurrencyLogs] = useState([]);

  // Toast Feedback
  const [feedback, setFeedback] = useState(null);

  const notify = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUsers(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Inventory (Member 3)
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const [invRes, lowRes, alertsRes, movRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/low-stock'),
        fetch('/api/inventory/alerts'),
        fetch('/api/inventory/movements')
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
      console.error('Failed to load inventory data:', e);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchInventory();
  }, []);

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormError(null);
    setSubmittingUser(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        notify(`User ${newUser.firstName} ${newUser.lastName} successfully added!`);
        setShowAddUserModal(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          mobile: '',
          password: '',
          roleName: 'OPERATIONAL_MANAGER',
          accountStatus: 'ACTIVE'
        });
        fetchUsers();
        fetchStats();
      } else {
        setUserFormError(json.message || 'Failed to create user.');
      }
    } catch (err) {
      setUserFormError('Network error while creating user.');
    } finally {
      setSubmittingUser(false);
    }
  };

  // Toggle User Status (ACTIVE <-> LOCKED)
  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.accountStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${user.userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        notify(`User status changed to ${nextStatus}.`);
        fetchUsers();
      } else {
        notify('Failed to update status', true);
      }
    } catch (e) {
      notify('Network error', true);
    }
  };

  // Change User Role
  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: newRole })
      });
      if (res.ok) {
        notify(`User role updated to ${newRole}.`);
        fetchUsers();
      } else {
        notify('Failed to update role', true);
      }
    } catch (e) {
      notify('Network error', true);
    }
  };

  // Handle Replenish (sp_add_stock)
  const handleReplenish = async (e) => {
    e.preventDefault();
    if (!replenishData.productId || !replenishData.quantity) {
      notify('Please select a product and enter quantity', true);
      return;
    }
    setReplenishLoading(true);
    try {
      const res = await fetch('/api/inventory/replenish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(replenishData.productId),
          quantity: parseFloat(replenishData.quantity),
          notes: replenishData.notes
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        notify(`Restocked ${replenishData.quantity} units via sp_add_stock!`);
        setReplenishData({ productId: '', quantity: '', notes: 'Warehouse delivery restock batch' });
        fetchInventory();
        fetchStats();
      } else {
        notify(json.message || 'Restock failed', true);
      }
    } catch (err) {
      notify('Network error during restock', true);
    } finally {
      setReplenishLoading(false);
    }
  };

  // Handle Concurrency Atomic Decrement (sp_atomic_stock_decrement)
  const handleAtomicDecrement = async (e) => {
    e.preventDefault();
    if (!decrementData.productId || !decrementData.quantity) {
      notify('Please select product and quantity', true);
      return;
    }
    setDecrementLoading(true);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/inventory/atomic-decrement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(decrementData.productId),
          quantity: parseFloat(decrementData.quantity)
        })
      });
      const duration = Math.round(performance.now() - startTime);
      const json = await res.json();

      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        productId: decrementData.productId,
        quantity: decrementData.quantity,
        success: json.success && json.data?.success,
        remainingStock: json.data?.remainingStock,
        message: json.message || (json.data?.success ? 'Decrement committed' : 'Rollback: Insufficient stock'),
        latency: `${duration}ms`
      };

      setConcurrencyLogs((prev) => [logEntry, ...prev.slice(0, 9)]);

      if (json.success && json.data?.success) {
        notify(`Deducted ${decrementData.quantity} units atomically (Lock acquired & released).`);
        fetchInventory();
        fetchStats();
      } else {
        notify(`Decrement blocked: Insufficient stock (Safe rollback executed).`, true);
      }
    } catch (err) {
      notify('Network error during atomic decrement', true);
    } finally {
      setDecrementLoading(false);
    }
  };

  // Resolve Low Stock Alert
  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'PUT'
      });
      if (res.ok) {
        notify('Alert marked as resolved.');
        fetchInventory();
        fetchStats();
      }
    } catch (err) {
      notify('Failed to resolve alert', true);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.mobile.includes(userSearch);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in slide-in-from-bottom-5 ${
            feedback.isError
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          {feedback.isError ? (
            <XCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Top Executive Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-tight">SuperMart Admin</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Internal Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Staff, Role-Based Access & Warehouse Inventory System (Members 1 & 3)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Storefront Link */}
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Storefront</span>
            </button>

            {/* Current Admin Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-300">
                {currentUser?.firstName || 'Admin'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] font-bold">
                {currentUser?.role || 'SUPER_ADMIN'}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & User Registry</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {stats.totalUsers}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Stock Levels</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {inventoryList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('replenish')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'replenish'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Stock Restock (sp_add_stock)</span>
          </button>

          <button
            onClick={() => setActiveTab('concurrency')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'concurrency'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Concurrency Decrement Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('lowstock')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lowstock'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock & Alerts</span>
            {stats.unresolvedAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {stats.unresolvedAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'movements'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Ledger</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Metrics Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Users
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-white">{stats.totalUsers}</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Catalog
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-white">{stats.totalProducts}</span>
              <Package className="w-4 h-4 text-teal-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              On-Hand Stock
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-white">
                {(Number(stats.totalStockQuantity) || 0).toFixed(0)}
              </span>
              <Boxes className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Low-Stock Items
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span
                className={`text-2xl font-black ${
                  stats.lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                {stats.lowStockCount}
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Open Alerts
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span
                className={`text-2xl font-black ${
                  stats.unresolvedAlertsCount > 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {stats.unresolvedAlertsCount}
              </span>
              <BadgeAlert className="w-4 h-4 text-rose-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Stock Movements
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-white">
                {stats.totalStockMovements}
              </span>
              <History className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </div>

        {/* TAB 1: USERS & STAFF MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">System User & Staff Directory</h2>
                <p className="text-xs text-slate-400">
                  Manage Super Admins, Operational Managers, and Customers with role assignment and account controls.
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Add System User</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name, email, or mobile..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Roles ({users.length})</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>

                <button
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  title="Refresh Users"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                          Loading system users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-500">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.userId} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500">#{u.userId}</td>
                          <td className="py-3 px-4 font-bold text-white">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.mobile}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                                  : u.role === 'OPERATIONAL_MANAGER'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                  : 'bg-blue-950/60 text-blue-300 border-blue-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.accountStatus === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.accountStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">{u.createdAt}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Change Role Selector */}
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.userId, e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                              >
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER</option>
                                <option value="CUSTOMER">CUSTOMER</option>
                              </select>

                              {/* Lock / Unlock Toggle */}
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                  u.accountStatus === 'ACTIVE'
                                    ? 'border-amber-800 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                                    : 'border-emerald-800 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                                }`}
                                title={u.accountStatus === 'ACTIVE' ? 'Lock Account' : 'Activate Account'}
                              >
                                {u.accountStatus === 'ACTIVE' ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY & STOCK LEVELS (Member 3) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Live Warehouse Stock Levels</h2>
                <p className="text-xs text-slate-400">
                  Real-time inventory levels evaluated via stored function <code>fn_get_stock_status</code>.
                </p>
              </div>

              <button
                onClick={fetchInventory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryList.map((item) => (
                <div
                  key={item.productId}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {item.categoryName} • {item.brandName || 'Store Brand'}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                        {item.productName}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        item.stockStatus === 'HEALTHY'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : item.stockStatus === 'LOW_STOCK'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800'
                      }`}
                    >
                      {item.stockStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Available Stock</span>
                      <span className="text-base font-black text-emerald-400">
                        {item.stockQuantity} {item.sellingUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Min Threshold</span>
                      <span className="text-sm font-bold text-slate-400">
                        {item.lowStockThreshold} {item.sellingUnit}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setReplenishData({
                        productId: item.productId,
                        quantity: '50',
                        notes: 'Quick restock from stock levels grid'
                      });
                      setActiveTab('replenish');
                    }}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Replenish Stock &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STOCK REPLENISHMENT (sp_add_stock) */}
        {activeTab === 'replenish' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">Stock Replenishment</h2>
              <p className="text-xs text-slate-400 mt-1">
                Executes MySQL Stored Procedure <code>sp_add_stock</code>: safely increments quantity and records an entry into <code>stock_movements</code>.
              </p>
            </div>

            <form
              onSubmit={handleReplenish}
              className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Product to Restock
                </label>
                <select
                  value={replenishData.productId}
                  onChange={(e) =>
                    setReplenishData({ ...replenishData, productId: e.target.value })
                  }
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Product from Catalog --</option>
                  {inventoryList.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName} ({p.stockQuantity} {p.sellingUnit} currently in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={replenishData.quantity}
                  onChange={(e) =>
                    setReplenishData({ ...replenishData, quantity: e.target.value })
                  }
                  placeholder="e.g. 100"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Batch Notes / Vendor PO
                </label>
                <input
                  type="text"
                  value={replenishData.notes}
                  onChange={(e) =>
                    setReplenishData({ ...replenishData, notes: e.target.value })
                  }
                  placeholder="Delivery order notes"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={replenishLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {replenishLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Boxes className="w-4 h-4" />
                )}
                <span>Execute Restock (`sp_add_stock`)</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CONCURRENCY DECREMENT SANDBOX (sp_atomic_stock_decrement) */}
        {activeTab === 'concurrency' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
                  <Zap className="w-3.5 h-3.5" /> High-Concurrency Transaction Engine
                </div>
                <h2 className="text-xl font-black text-white">Atomic Stock Decrement Sandbox</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tests stored procedure <code>sp_atomic_stock_decrement</code>. It acquires an exclusive row lock (<code>SELECT ... FOR UPDATE</code>) and safely decrements stock or triggers an automated rollback if stock is insufficient.
                </p>
              </div>

              <form
                onSubmit={handleAtomicDecrement}
                className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Product
                  </label>
                  <select
                    value={decrementData.productId}
                    onChange={(e) =>
                      setDecrementData({ ...decrementData, productId: e.target.value })
                    }
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Choose Product --</option>
                    {inventoryList.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.productName} ({p.stockQuantity} {p.sellingUnit} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deduct Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={decrementData.quantity}
                    onChange={(e) =>
                      setDecrementData({ ...decrementData, quantity: e.target.value })
                    }
                    placeholder="Enter units (e.g. 5 or 999999 to test rollback)"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tip: Enter an amount larger than available stock (e.g. 999999) to see the transaction rollback in real-time.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={decrementLoading}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {decrementLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Run Atomic Decrement (`sp_atomic_stock_decrement`)</span>
                </button>
              </form>
            </div>

            {/* Decrement Results Log */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center justify-between">
                <span>Concurrency Execution Log</span>
                <span className="text-xs text-slate-500 font-normal">Real-time audit trace</span>
              </h3>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {concurrencyLogs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-500 text-xs">
                    Run an atomic decrement above to view the transaction lock trace.
                  </div>
                ) : (
                  concurrencyLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                        log.success
                          ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span>{log.timestamp}</span>
                          <span>•</span>
                          <span>Product #{log.productId}</span>
                          <span>•</span>
                          <span>{log.quantity} units</span>
                        </div>
                        <p className="mt-1 font-semibold">{log.message}</p>
                        {log.remainingStock !== undefined && log.remainingStock !== null && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Remaining stock in DB: {log.remainingStock}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            log.success ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {log.success ? 'COMMITTED' : 'ROLLED BACK'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          {log.latency}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LOW STOCK & TRIGGER ALERTS */}
        {activeTab === 'lowstock' && (
          <div className="space-y-8">
            {/* View Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">
                  Database View: <code>v_low_stock_report</code>
                </h3>
                <p className="text-xs text-slate-400">
                  Projects inventory rows where on-hand quantity is less than or equal to minimum threshold.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Product ID</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Min Threshold</th>
                      <th className="py-3 px-4">Reorder Deficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {lowStockReport.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                          All warehouse items are currently healthy and above minimum thresholds!
                        </td>
                      </tr>
                    ) : (
                      lowStockReport.map((row) => (
                        <tr key={row.productId} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4 font-mono text-slate-500">#{row.productId}</td>
                          <td className="py-3 px-4 font-bold text-white">{row.productName}</td>
                          <td className="py-3 px-4 text-slate-400">{row.categoryName}</td>
                          <td className="py-3 px-4 text-rose-400 font-bold">
                            {row.stockQuantity}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{row.lowStockThreshold}</td>
                          <td className="py-3 px-4 text-amber-400 font-bold">
                            +{row.reorderDeficit || Math.max(0, (Number(row.lowStockThreshold) || 0) - (Number(row.stockQuantity) || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trigger Alerts Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">
                  Automated Trigger Alerts (<code>trg_check_low_stock</code>)
                </h3>
                <p className="text-xs text-slate-400">
                  Whenever an update drives inventory below threshold, MySQL fires <code>trg_check_low_stock</code> and creates an alert.
                </p>
              </div>

              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-500 text-xs">
                    No active low-stock alerts.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.alertId}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                          !
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            Alert #{alert.alertId} — Product #{alert.productId}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Recorded Stock: {alert.stockQuantity} | Threshold: {alert.thresholdQuantity} | Created: {alert.createdAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.alertStatus === 'OPEN'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {alert.alertStatus}
                        </span>

                        {alert.alertStatus === 'OPEN' && (
                          <button
                            onClick={() => handleResolveAlert(alert.alertId)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Resolve Alert
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LEDGER (stock_movements) */}
        {activeTab === 'movements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Stock Movements Audit Ledger</h2>
                <p className="text-xs text-slate-400">
                  Chronological trail of every stock modification from table <code>stock_movements</code>.
                </p>
              </div>

              <button
                onClick={fetchInventory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Movement ID</th>
                      <th className="py-3 px-4">Product ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Quantity Delta</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500">
                          No stock movements recorded yet.
                        </td>
                      </tr>
                    ) : (
                      movements.map((m) => (
                        <tr key={m.movementId} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4 font-mono text-slate-500">#{m.movementId}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">Product #{m.productId}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                m.movementType === 'STOCK_IN'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                  : m.movementType === 'SALE'
                                  ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                                  : 'bg-purple-950/60 text-purple-300 border border-purple-800'
                              }`}
                            >
                              {m.movementType}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-bold ${
                              m.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {m.referenceType || 'SYSTEM'} #{m.referenceId || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{m.notes || '—'}</td>
                          <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                            {m.createdAt}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ADD NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Add System User / Staff</h3>
                  <p className="text-xs text-slate-400">
                    Register a new administrative or store account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {userFormError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-semibold">
                {userFormError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    required
                    placeholder="e.g. Kasun"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    required
                    placeholder="e.g. Perera"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="kasun.perera@supermart.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={newUser.mobile}
                  onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                  required
                  placeholder="+94771234567 or 0771234567"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">System Role</label>
                  <select
                    value={newUser.roleName}
                    onChange={(e) => setNewUser({ ...newUser, roleName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={newUser.accountStatus}
                    onChange={(e) => setNewUser({ ...newUser, accountStatus: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingUser && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add User to System</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
