import React, { useState } from 'react';
import { Wallet, PieChart, TrendingUp, AlertTriangle, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { store } from '../../services/store';
import { Budget } from '../../types';

export const LocalBudgetView: React.FC = () => {
  const localBudgets = store.getBudgets().filter(b => b.budgetType === 'Local');

  const totalAllocated = localBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = localBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalCommitted = localBudgets.reduce((sum, b) => sum + b.committed, 0);
  const totalRemaining = localBudgets.reduce((sum, b) => sum + b.remaining, 0);

  const canManage = store.hasPermission('budget', 'update') || store.getCurrentUser()?.role === 'admin';

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState('');
  const [formAllocated, setFormAllocated] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setFormCategory('');
    setFormAllocated(0);
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormCategory(budget.category);
    setFormAllocated(budget.allocated);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory.trim() || formAllocated <= 0) {
      setError('Please provide a valid category name and allocated budget amount.');
      return;
    }

    // Check duplicate
    const exists = localBudgets.some(b => b.category.toLowerCase() === formCategory.trim().toLowerCase());
    if (exists) {
      setError('A budget category pool with this name already exists.');
      return;
    }

    const budgetId = `BDG-${Math.floor(100 + Math.random() * 900)}`;
    const res = store.addBudget({
      budgetId,
      period: 'August 2026',
      budgetType: 'Local',
      category: formCategory.trim(),
      allocated: formAllocated,
      spent: 0,
      committed: 0
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setError(res.error || 'Failed to add budget pool');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;

    if (!formCategory.trim() || formAllocated <= 0) {
      setError('Please provide a valid category name and allocated budget.');
      return;
    }

    // Check duplicate name (except current)
    const exists = localBudgets.some(
      b => b.id !== selectedBudget.id && b.category.toLowerCase() === formCategory.trim().toLowerCase()
    );
    if (exists) {
      setError('Another budget category pool with this name already exists.');
      return;
    }

    const res = store.updateBudget(selectedBudget.id, {
      category: formCategory.trim(),
      allocated: formAllocated
    });

    if (res.success) {
      setIsEditModalOpen(false);
      setSelectedBudget(null);
    } else {
      setError(res.error || 'Failed to update budget pool');
    }
  };

  const handleDelete = (budget: Budget) => {
    if (!confirm(`Are you sure you want to delete the budget pool for "${budget.category}"? This cannot be undone.`)) {
      return;
    }

    const res = store.deleteBudget(budget.id);
    if (!res.success) {
      alert(res.error || 'Failed to delete budget pool.');
    }
  };

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

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category Pool</span>
          </button>
        )}
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
                {canManage && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {localBudgets.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-8 text-center text-slate-500 font-medium">
                    No budget category pools created yet.
                  </td>
                </tr>
              ) : (
                localBudgets.map(b => {
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
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
                              title="Edit Pool / Set Budget"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(b)}
                              className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Category Pool"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Budget Category Pool Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Wallet className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Create Local Budget Pool</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Establish a new local category budget allocation pool.</p>

            {error && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  placeholder="e.g. Local Media Partnerships"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Allocated Budget ($ USD) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formAllocated || ''}
                  onChange={e => setFormAllocated(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/15"
                >
                  Create Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Category Pool Dialog */}
      {isEditModalOpen && selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedBudget(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Edit2 className="w-4 h-4" />
              <h3 className="text-base font-bold text-white">Modify Local Budget Pool</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Set the allocated budget or alter the category name for this local operation pool.</p>

            {error && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Note: Changing the name will automatically update all linked expense records as well.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Allocated Budget ($ USD) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formAllocated || ''}
                  onChange={e => setFormAllocated(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Stats Card */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Spent & Committed Stats</h4>
                <div className="flex justify-between text-slate-300">
                  <span>Spent:</span>
                  <span className="font-mono font-semibold text-rose-300">${selectedBudget.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Committed:</span>
                  <span className="font-mono font-semibold text-amber-300">${selectedBudget.committed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/50">
                  <span>New Remaining Est:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${(formAllocated - selectedBudget.spent - selectedBudget.committed).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedBudget(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-sky-500/15"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
