import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Download } from 'lucide-react';
import { store } from '../../services/store';
import * as XLSX from 'xlsx';

export const AuditLogsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');

  const logs = store.getAuditLogs();
  const users = store.getUsers();

  const filtered = logs.filter(l => {
    const matchesSearch =
      l.record.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase());

    const matchesModule = selectedModule === 'All' || l.module === selectedModule;
    const matchesUser = selectedUser === 'All' || l.user === selectedUser;

    return matchesSearch && matchesModule && matchesUser;
  });

  const handleExport = () => {
    const data = filtered.map(l => ({
      Timestamp: l.dateTime,
      User: l.user,
      Username: l.username,
      Action: l.action,
      Module: l.module,
      Record: l.record
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditLogs");
    XLSX.writeFile(wb, `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>System Audit & Security Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Immutable record of all operational actions, data edits, status changes, & security events</p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span>Export Audit Logs</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search record, user, action..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Modules</option>
            <option value="influencers">Influencers</option>
            <option value="targets">Targets</option>
            <option value="deliveries">Deliveries</option>
            <option value="billboards">Billboards</option>
            <option value="lcd_screens">LCD Screens</option>
            <option value="budget">Budget</option>
            <option value="users">Users</option>
            <option value="Auth">Auth & Security</option>
          </select>

          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.fullName}>{u.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">User Account</th>
                <th className="py-3 px-4 font-semibold text-center">Module</th>
                <th className="py-3 px-4 font-semibold text-center">Action Type</th>
                <th className="py-3 px-4 font-semibold">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit log records match the selected search query.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">{log.dateTime}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{log.user}</div>
                      <div className="text-[10px] text-slate-500 font-mono">@{log.username}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-300">{log.module}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action.includes('CREATE') || log.action.includes('ADD')
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : log.action.includes('UPDATE') || log.action.includes('APPROVE')
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : log.action.includes('DELETE')
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-mono text-[11px]">{log.record}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
