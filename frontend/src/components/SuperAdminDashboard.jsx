import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Boxes,
  TrendingUp,
  History,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Package,
  LogOut,
  ArrowLeft,
  Key,
  SlidersHorizontal,
  PackageCheck,
  FileCode2,
  Sparkles
} from 'lucide-react';
import SalesAnalyticsTab from './admin/SalesAnalyticsTab';
import AuditTrailTab from './admin/AuditTrailTab';
import OrdersTab from './admin/OrdersTab';

export default function SuperAdminDashboard({ currentUser, onNavigateHome, onLogout }) {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'users' | 'orders' | 'inventory' | 'audit'
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

  // Inventory State
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Feedback Notification
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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setUsers(json.data);
      }
    } catch (e) {
      notify('Failed to load user directory.', true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setInventoryList(json.data);
      }
    } catch (e) {
      console.error('Inventory error:', e);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchInventory();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormError(null);
    setSubmittingUser(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        notify(`User ${newUser.firstName} ${newUser.lastName} registered successfully!`);
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
      setUserFormError('Network error adding user.');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accountStatus: nextStatus })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        notify(`User #${userId} status changed to ${nextStatus}. Trigger trg_audit_user_update logged.`);
        fetchUsers();
      } else {
        notify(json.message || 'Status update failed.', true);
      }
    } catch (err) {
      notify('Network error updating status.', true);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roleName: newRole })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        notify(`Role updated to ${newRole} for user #${userId}.`);
        fetchUsers();
      } else {
        notify(json.message || 'Role change failed.', true);
      }
    } catch (err) {
      notify('Network error changing role.', true);
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = userSearch.toLowerCase();
    const matchSearch =
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.mobile.includes(s);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-950 tracking-tight">SuperMart Admin</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Executive Portal
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Staff Governance, Enterprise Reconciliation & Audit Stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Storefront Link */}
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <span>Back to Storefront</span>
            </button>

            {/* Current Admin Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold text-slate-800">
                {currentUser?.firstName || 'Admin'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                SUPER_ADMIN
              </span>
            </div>

            {/* Logout Button */}
            <button
              id="admin-logout-btn"
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
            onClick={() => setActiveTab('sales')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales & Reconciliation</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & User Registry</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
              {stats.totalUsers}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>System Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Customer Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Warehouse Stock Levels</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
              {inventoryList.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB 1: EXECUTIVE SALES ANALYTICS & RECONCILIATION */}
        {activeTab === 'sales' && (
          <SalesAnalyticsTab currentUser={currentUser} notify={notify} />
        )}

        {/* TAB 2: STAFF & USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">System User & Staff Directory</h2>
                <p className="text-xs text-slate-500">
                  Manage Super Admins, Operational Managers, and Customers with role assignment and account controls.
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Add System User</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name, email, or mobile..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs font-medium"
                >
                  <option value="ALL">All Roles ({users.length})</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                          Loading system directory...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.userId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{u.firstName} {u.lastName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: #{u.userId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800">{u.email}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.mobile}</div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role || 'CUSTOMER'}
                              onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                            >
                              <option value="CUSTOMER">CUSTOMER</option>
                              <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleStatusToggle(u.userId, u.accountStatus)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                u.accountStatus === 'ACTIVE'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={u.accountStatus === 'ACTIVE' ? 'Lock Account' : 'Unlock Account'}
                            >
                              {u.accountStatus === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
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

        {/* TAB 3: SYSTEM AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <AuditTrailTab currentUser={currentUser} notify={notify} />
        )}

        {/* TAB 4: CUSTOMER ORDERS */}
        {activeTab === 'orders' && (
          <OrdersTab currentUser={currentUser} notify={notify} />
        )}

        {/* TAB 5: WAREHOUSE STOCK LEVELS */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Warehouse Inventory Oversight</h3>
                <p className="text-xs text-slate-500">Live stock levels with dynamic status computed by <code>fn_get_stock_status</code>.</p>
              </div>
              <button
                onClick={fetchInventory}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInventory ? 'animate-spin text-emerald-600' : ''}`} />
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

      </main>

      {/* ADD NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Staff or Customer</h3>
                  <p className="text-xs text-slate-500">Create new user accounts directly with RBAC assignments.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {userFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={newUser.mobile}
                  onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                  placeholder="0771234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={newUser.roleName}
                    onChange={(e) => setNewUser({ ...newUser, roleName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-semibold"
                  >
                    <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={newUser.accountStatus}
                    onChange={(e) => setNewUser({ ...newUser, accountStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
