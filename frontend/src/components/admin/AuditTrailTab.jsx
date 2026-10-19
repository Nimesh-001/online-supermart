import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Terminal, 
  Clock, 
  User, 
  Database,
  ArrowRight
} from 'lucide-react';

export default function AuditTrailTab({ currentUser, notify }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/audit-logs?limit=50', {
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setLogs(json.data);
        }
      }
    } catch (e) {
      notify('Failed to load system audit trail.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const s = search.toLowerCase();
    return (
      l.actionType?.toLowerCase().includes(s) ||
      l.entityName?.toLowerCase().includes(s) ||
      l.description?.toLowerCase().includes(s) ||
      String(l.entityId).includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-purple-600" />
            <span>System Audit Trail & Trigger Log</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time audit log stream driven by MySQL trigger <code>trg_audit_user_update</code> and administrative operations.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors"
          title="Refresh Audit Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit logs by action type, entity name, or description..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-xs"
        />
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Action Type</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">JSON State Delta</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                  Streaming audit trail...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 font-sans">
                  No audit logs found. Try changing user status in User Registry to trigger <code>trg_audit_user_update</code>!
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.auditId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-500">#{l.auditId}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.actionType === 'STATUS_CHANGE'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {l.actionType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">
                    {l.entityName} <span className="text-slate-400 font-mono text-[10px]">#{l.entityId}</span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700 max-w-xs truncate">
                    {l.description}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    {l.oldValues || l.newValues ? (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[10px] space-y-0.5 text-slate-800 overflow-x-auto">
                        {l.oldValues && <div className="text-rose-600">Old: {l.oldValues}</div>}
                        {l.newValues && <div className="text-emerald-700 font-semibold">New: {l.newValues}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-sans italic">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans text-[11px] whitespace-nowrap">
                    {l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
