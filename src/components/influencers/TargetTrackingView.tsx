import React, { useState, useEffect } from 'react';
import { Target, Search, Calendar, Edit3, ShieldAlert, CheckCircle2, RotateCw, Download, FileSpreadsheet } from 'lucide-react';
import { store } from '../../services/store';
import { InfluencerTarget } from '../../types';
import { getCurrentMonthKey, toMonthDisplay } from '../../utils/budgetUtils';
import * as XLSX from 'xlsx';

export const TargetTrackingView: React.FC = () => {
  const currentMonthKey = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [search, setSearch] = useState('');
  const [editingTarget, setEditingTarget] = useState<InfluencerTarget | null>(null);
  const [completedInput, setCompletedInput] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return () => unsub();
  }, []);

  const targets = store.getTargets();
  const influencers = store.getInfluencers();
  const canUpdate = store.hasPermission('targets', 'update');
  const canExport = store.hasPermission('targets', 'export') || store.getCurrentUser()?.role === 'admin';
  const availableMonths = store.getAvailableMonths();

  const filtered = targets.filter(t =>
    t.influencerName.toLowerCase().includes(search.toLowerCase()) &&
    (selectedMonth === 'All' || t.monthYear === selectedMonth)
  );

  const getExportData = () => {
    return filtered.map(t => {
      const inf = influencers.find(i => i.id === t.influencerId || i.fullName.toLowerCase() === t.influencerName.toLowerCase());
      return {
        'Influencer': t.influencerName,
        'Influencer Phone Number': inf?.phone || 'N/A',
        'Cycle Month': toMonthDisplay(t.monthYear),
        'Target Videos': t.targetVideos,
        'Completed Videos': t.completedVideos,
        'Remaining Videos': t.remainingVideos,
        'Achievement %': `${t.achievementPercent}%`,
        'Status': t.status
      };
    });
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Influencer Targets');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Influencer_Targets_${selectedMonth}_${dateStr}.xlsx`);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Influencer Targets');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Influencer_Targets_${selectedMonth}_${dateStr}.csv`, { bookType: 'csv' });
  };

  const handleOpenEdit = (target: InfluencerTarget) => {
    if (!canUpdate) {
      setPermissionError('Permission denied: You do not have permission to update influencer targets');
      return;
    }
    setEditingTarget(target);
    setCompletedInput(target.completedVideos);
  };

  const handleSaveCompleted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    const res = store.updateTarget(editingTarget.id, completedInput);
    if (res.success) {
      setEditingTarget(null);
    } else {
      setPermissionError(res.error || 'Failed to update target');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-400 border border-amber-800/60">
              Monthly Tracking Cycle: {toMonthDisplay(selectedMonth === 'All' ? currentMonthKey : selectedMonth)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <span>Influencer Target Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Automated formula calculation: Achievement % = Completed ÷ Target × 100, Remaining = Target - Completed</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search influencer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 text-white pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Months (History)</option>
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {toMonthDisplay(m)} {m === currentMonthKey ? '★ (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {canExport && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="Export target tracking with phone numbers to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="Export target tracking with phone numbers to CSV (.csv)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {permissionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{permissionError}</span>
          </div>
          <button onClick={() => setPermissionError(null)} className="text-rose-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Target Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Influencer</th>
                <th className="py-3 px-4 font-semibold text-center">Monthly Target</th>
                <th className="py-3 px-4 font-semibold text-center">Completed</th>
                <th className="py-3 px-4 font-semibold text-center">Remaining</th>
                <th className="py-3 px-4 font-semibold text-center">Achievement %</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white text-sm">{t.influencerName}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-200">{t.targetVideos}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">{t.completedVideos}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-300">{t.remainingVideos}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-bold text-emerald-400 text-sm">{t.achievementPercent}%</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === 'Exceeded'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : t.status === 'Target Completed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg border border-slate-700 flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Log Progress</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Target Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Update Progress: {editingTarget.influencerName}</h3>
            <p className="text-xs text-slate-400 mb-4">Set completed video count for {editingTarget.monthYear}</p>

            <form onSubmit={handleSaveCompleted} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Videos</label>
                <input
                  type="number"
                  disabled
                  value={editingTarget.targetVideos}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Completed Videos Count *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completedInput}
                  onChange={e => setCompletedInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>New Achievement:</span>
                  <span className="font-bold text-emerald-400">
                    {editingTarget.targetVideos > 0 ? ((completedInput / editingTarget.targetVideos) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>New Remaining:</span>
                  <span className="font-semibold text-slate-200">
                    {Math.max(0, editingTarget.targetVideos - completedInput)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
