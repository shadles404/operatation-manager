import React, { useState } from 'react';
import { DollarSign, Plus, Search, AlertTriangle, ShieldAlert, Download, CheckSquare, Square, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { store } from '../../services/store';
import { Expense, BudgetType, BudgetCategory } from '../../types';
import * as XLSX from 'xlsx';

export const ExpensesView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  // Expense Form State
  const [category, setCategory] = useState<BudgetCategory>('Influencers');
  const [budgetType, setBudgetType] = useState<BudgetType>('Local');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(300);
  const [date, setDate] = useState('2026-08-27');
  const [notes, setNotes] = useState('');

  const expenses = store.getExpenses();
  const budgets = store.getBudgets();

  const fallbackCategories = [
    'Influencers',
    'Billboards',
    'LCD Screens',
    'Product Delivery',
    'Printing',
    'Production',
    'Other Marketing Operations'
  ];
  const availableCategories = budgets.filter(b => b.budgetType === budgetType).map(b => b.category);
  const categoriesList = availableCategories.length > 0 ? Array.from(new Set(availableCategories)) : fallbackCategories;

  const canAdd = store.hasPermission('expenses', 'add') || store.hasPermission('budget', 'add');
  const canUpdate = store.hasPermission('expenses', 'update') || store.hasPermission('budget', 'update');
  const canDelete = store.hasPermission('expenses', 'delete') || store.hasPermission('budget', 'delete');
  const canExport = store.hasPermission('expenses', 'export') || store.hasPermission('budget', 'export');

  const filtered = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const isAllSelected = filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(e => e.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteOne = (id: string, expenseIdStr: string) => {
    if (!canDelete) {
      setPermissionError('Permission denied: Cannot delete expense record');
      return;
    }
    if (confirm(`Are you sure you want to delete expense record ${expenseIdStr}?`)) {
      const res = store.deleteExpense(id);
      if (!res.success) {
        setPermissionError(res.error || 'Failed to delete expense record');
      } else {
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return;
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected expense record(s)?`)) {
      const res = await store.bulkDeleteExpenses(selectedIds);
      if (res.success) {
        setSelectedIds([]);
      } else {
        setPermissionError(res.error || 'Failed to bulk delete expense records');
      }
    }
  };

  const handleBulkStatus = async (paymentStatus: Expense['paymentStatus']) => {
    if (!canUpdate) return;
    if (selectedIds.length === 0) return;
    const res = await store.bulkUpdateExpenseStatus(selectedIds, paymentStatus);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to bulk update status');
    }
  };

  const handleAmountChange = (val: number) => {
    setAmount(val);
    const pool = budgets.find(b => b.category === category && b.budgetType === budgetType);
    if (pool && val > pool.remaining) {
      setBudgetWarning(`Warning: Expense amount ($${val}) exceeds the remaining budget ($${pool.remaining}) for ${category}!`);
    } else {
      setBudgetWarning(null);
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setPermissionError('Permission denied: You do not have permission to log expenses');
      return;
    }

    const res = store.addExpense({
      category,
      budgetType,
      description,
      amount,
      currency: 'USD',
      date,
      requestedBy: store.getCurrentUser().fullName,
      paymentStatus: 'Paid',
      notes
    });

    if (res.success) {
      setIsModalOpen(false);
      setDescription('');
      setBudgetWarning(null);
    } else {
      setPermissionError(res.error || 'Failed to add expense');
    }
  };

  const handleExport = () => {
    if (!canExport) {
      setPermissionError('Permission denied: Cannot export expenses');
      return;
    }
    const data = filtered.map(e => ({
      ExpenseID: e.id,
      Category: e.category,
      BudgetType: e.budgetType,
      Description: e.description,
      AmountUSD: e.amount,
      Date: e.date,
      RequestedBy: e.requestedBy,
      Status: e.paymentStatus
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Expenses_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-400" />
            <span>Marketing Expense Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time expenditure tracking with automatic budget pool deduction & overdraft warnings</p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
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

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
            <CheckSquare className="w-4 h-4 text-rose-400" />
            <span>{selectedIds.length} expense record(s) selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <>
                <button
                  onClick={() => handleBulkStatus('Paid')}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Set Paid</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('Pending Approval')}
                  className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set Pending</span>
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Bulk Delete ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, category..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-10">
                  <button 
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-rose-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Expense ID</th>
                <th className="py-3 px-4 font-semibold">Category & Scope</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Date</th>
                <th className="py-3 px-4 font-semibold text-center">Requested By</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(exp => {
                const isSelected = selectedIds.includes(exp.id);
                return (
                  <tr key={exp.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-rose-500/5' : ''}`}>
                    <td className="py-3.5 px-4">
                      <button 
                        onClick={() => handleSelectOne(exp.id)}
                        className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-rose-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{exp.expenseId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{exp.category}</div>
                      <div className="text-[10px] text-slate-400">{exp.budgetType} Pool</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{exp.description}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-300">${exp.amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{exp.date}</td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-semibold">{exp.requestedBy}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteOne(exp.id, exp.expenseId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Delete Expense Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Log Marketing Expense</h3>
            <p className="text-xs text-slate-400 mb-4">Record operational disbursement & deduct from budget pool</p>

            {budgetWarning && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{budgetWarning}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Budget Pool *</label>
                  <select
                    value={budgetType}
                    onChange={e => {
                      const newType = e.target.value as BudgetType;
                      setBudgetType(newType);
                      const cats = budgets.filter(b => b.budgetType === newType).map(b => b.category);
                      const list = cats.length > 0 ? Array.from(new Set(cats)) : fallbackCategories;
                      setCategory(list[0]);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Local">Local Budget</option>
                    <option value="International">International Budget</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as BudgetCategory)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Payment for promotional content"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={e => handleAmountChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional context or references..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
