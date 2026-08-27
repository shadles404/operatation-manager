import React from 'react';
import { Wallet, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import { store } from '../../services/store';

export const LocalBudgetView: React.FC = () => {
  const localBudgets = store.getBudgets().filter(b => b.budgetType === 'Local');

  const totalAllocated = localBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = localBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalCommitted = localBudgets.reduce((sum, b) => sum + b.committed, 0);
  const totalRemaining = localBudgets.reduce((sum, b) => sum + b.remaining, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>Local Marketing Budget Pools</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Local Somalia operations allocations (Influencers, Local Outdoor, Events, Samples)</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Allocated</div>
          <div className="text-2xl font-black text-white mt-1">${totalAllocated.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Spent Amount</div>
          <div className="text-2xl font-black text-rose-400 mt-1">${totalSpent.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Committed (Pending)</div>
          <div className="text-2xl font-black text-amber-400 mt-1">${totalCommitted.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Remaining Pool</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">${totalRemaining.toLocaleString()}</div>
        </div>
      </div>

      {/* Pools Detail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-bold text-white text-sm">
          Local Category Allocations ({localBudgets[0]?.period || 'August 2026'})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Allocated</th>
                <th className="py-3 px-4 font-semibold text-right">Spent</th>
                <th className="py-3 px-4 font-semibold text-right">Committed</th>
                <th className="py-3 px-4 font-semibold text-right">Remaining</th>
                <th className="py-3 px-4 font-semibold text-center">Utilization</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {localBudgets.map(b => {
                const usedPercent = Math.round(((b.spent + b.committed) / b.allocated) * 100) || 0;
                return (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{b.category}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${b.allocated.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-300">${b.spent.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-300">${b.committed.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">${b.remaining.toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${usedPercent > 90 ? 'bg-rose-500' : usedPercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, usedPercent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">{usedPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.warningLevel === 'Exceeded'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : b.warningLevel === 'Warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {b.warningLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
