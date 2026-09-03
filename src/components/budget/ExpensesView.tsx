import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  Globe,
  Wallet,
  X
} from 'lucide-react';
import { store } from '../../services/store';
import { Expense, BudgetType, BudgetCategory } from '../../types';
import {
  formatCurrency,
  toMonthKey,
  toMonthDisplay,
  getSelectableMonths,
  getTodayDate,
  STANDARD_EXPENSE_CATEGORIES
} from '../../utils/budgetUtils';
import * as XLSX from 'xlsx';

export const ExpensesView: React.FC = () => {
  const [, setTick] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPool, setSelectedPool] = useState<string>('ALL'); // 'ALL' | 'Local' | 'International'
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Log Form State
  const [formPool, setFormPool] = useState<BudgetType>('Local');
  const [formCategory, setFormCategory] = useState<BudgetCategory>('Influencers');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(getTodayDate());
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const expenses = store.getExpenses();
  const currentUser = store.getCurrentUser();
  const canAdd = store.hasPermission('expenses', 'add') || store.hasPermission('budget', 'add') || currentUser?.role === 'admin';
  const canUpdate = store.hasPermission('expenses', 'update') || store.hasPermission('budget', 'update') || currentUser?.role === 'admin';
  const canDelete = store.hasPermission('expenses', 'delete') || store.hasPermission('budget', 'delete') || currentUser?.role === 'admin';
  const canExport = store.hasPermission('expenses', 'export') || store.hasPermission('budget', 'export') || currentUser?.role === 'admin';

  const monthOptions = getSelectableMonths(2026);

  const allCategories = Array.from(new Set([
    ...store.getCategories('Local'),
    ...store.getCategories('International'),
    ...expenses.map(e => e.category)
  ])).filter(Boolean);

  const modalCategories = store.getCategories(formPool);

  // Filter expenses strictly based on real DB records
  const filtered = expenses.filter(e => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.expenseId.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
      e.requestedBy.toLowerCase().includes(search.toLowerCase());

    const matchPool = selectedPool === 'ALL' || e.budgetType === selectedPool;
    const matchCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchMonth = selectedMonth === 'ALL' || toMonthKey(e.date) === selectedMonth;

    return matchSearch && matchPool && matchCategory && matchMonth;
  });

  // Calculate live statistics based on real DB filtered expenses
  const totalFilteredSpent = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const localFilteredSpent = filtered
    .filter(e => e.budgetType === 'Local')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const intlFilteredSpent = filtered
    .filter(e => e.budgetType === 'International')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Selection handlers
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

  // Open Log Modal
  const handleOpenLogModal = () => {
    setFormPool('Local');
    setFormCategory('Influencers');
    setFormDescription('');
    setFormAmount('');
    setFormDate(getTodayDate());
    setFormNotes('');
    setErrorMessage(null);
    setIsLogModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormPool(exp.budgetType);
    setFormCategory(exp.category);
    setFormDescription(exp.description);
    setFormAmount(String(exp.amount));
    setFormDate(exp.date);
    setFormNotes(exp.notes || '');
    setErrorMessage(null);
  };

  // Submit Log Expense (Add)
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      setErrorMessage('Please provide an expense description / purpose.');
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid amount greater than $0.');
      return;
    }
    if (!formDate) {
      setErrorMessage('Please select a valid date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await store.addExpense({
      budgetType: formPool,
      category: formCategory,
      description: formDescription.trim(),
      amount: amt,
      date: formDate,
      notes: formNotes.trim()
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to record expense.');
    } else {
      setIsLogModalOpen(false);
    }
  };

  // Submit Edit Expense
  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    if (!formDescription.trim()) {
      setErrorMessage('Please provide an expense description / purpose.');
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid amount greater than $0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await store.updateExpense(editingExpense.id, {
      budgetType: formPool,
      category: formCategory,
      description: formDescription.trim(),
      amount: amt,
      date: formDate,
      notes: formNotes.trim()
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update expense.');
    } else {
      setEditingExpense(null);
    }
  };

  // Delete Single Expense
  const handleDeleteOne = async (exp: Expense) => {
    if (!canDelete) {
      setErrorMessage('Permission denied: Cannot delete expense record');
      return;
    }
    if (window.confirm(`Delete expense "${exp.description}" ($${exp.amount.toLocaleString()})? The amount will be returned to the budget.`)) {
      const res = await store.deleteExpense(exp.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete expense record');
      } else {
        setSelectedIds(prev => prev.filter(item => item !== exp.id));
      }
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!canDelete || selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} selected expense record(s)? All deleted amounts will be returned to their respective budgets.`)) {
      const res = await store.bulkDeleteExpenses(selectedIds);
      if (res.success) {
        setSelectedIds([]);
      } else {
        setErrorMessage(res.error || 'Failed to bulk delete expense records');
      }
    }
  };

  // Export to CSV/Excel
  const handleExport = () => {
    if (!canExport) {
      setErrorMessage('Permission denied: Cannot export expenses');
      return;
    }
    const data = filtered.map(e => ({
      ExpenseID: e.expenseId,
      BudgetPool: e.budgetType,
      Category: e.category,
      Description: e.description,
      AmountUSD: e.amount,
      Date: e.date,
      Month: toMonthDisplay(e.date),
      RecordedBy: e.requestedBy,
      Notes: e.notes || '',
      CreatedAt: e.createdAt
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marketing_Expenses');
    XLSX.writeFile(wb, `Marketing_Expense_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Marketing Expense Ledger</h1>
            <p className="text-sm text-slate-400">
              Real database ledger of actual marketing expenditures deducting from Local and International monthly budgets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canExport && (
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-medium text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV/Excel</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={handleOpenLogModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Marketing Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold text-base px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Live Financial Metrics (from Database) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Filtered Spend</span>
          <div className="text-2xl font-bold text-white mt-2">
            {formatCurrency(totalFilteredSpent)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{filtered.length} expense records</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Local Pool Spend</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-2">
            {formatCurrency(localFilteredSpent)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Deducted only from Local Budget</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">International Pool Spend</span>
            <Globe className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">
            {formatCurrency(intlFilteredSpent)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Deducted only from International Budget</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Month Scope</span>
          <div className="text-lg font-bold text-white mt-2">
            {selectedMonth === 'ALL' ? 'All Recorded Months' : toMonthDisplay(selectedMonth)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Separated by expense date</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, ID, notes..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All Months</option>
              {monthOptions.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-slate-800 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Pool Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPool}
              onChange={e => setSelectedPool(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All Budget Pools</option>
              <option value="Local" className="bg-slate-800 text-white">Local Budget</option>
              <option value="International" className="bg-slate-800 text-white">International Budget</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat} className="bg-slate-800 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">{selectedIds.length} selected</span>
            {canDelete && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No Expenses Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {expenses.length === 0
                ? 'No marketing expenses have been recorded yet in the database. Click "Log Marketing Expense" to record expenditures.'
                : 'No expense records match your active search and filter criteria.'}
            </p>
            {canAdd && (
              <button
                onClick={handleOpenLogModal}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log First Expense</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-white"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">Expense ID</th>
                  <th className="py-3 px-4 font-semibold">Pool</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Description / Purpose</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount ($ USD)</th>
                  <th className="py-3 px-4 font-semibold">Recorded By</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleSelectOne(exp.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {selectedIds.includes(exp.id) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-400 font-medium">
                      {exp.expenseId}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          exp.budgetType === 'International'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}
                      >
                        {exp.budgetType === 'International' ? (
                          <Globe className="w-3 h-3" />
                        ) : (
                          <Wallet className="w-3 h-3" />
                        )}
                        <span>{exp.budgetType}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{exp.description}</div>
                      {exp.notes && (
                        <div className="text-xs text-slate-400 mt-0.5">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white whitespace-nowrap">
                      {formatCurrency(exp.amount, true)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {exp.requestedBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            title="Edit Expense"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteOne(exp)}
                            title="Delete Expense"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Marketing Expense Modal (Matches user specifications exactly) */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Log Marketing Expense</h3>
                  <p className="text-xs text-slate-400">Record a real operational expenditure</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Budget Pool * */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Budget Pool *
                </label>
                <select
                  value={formPool}
                  onChange={e => setFormPool(e.target.value as BudgetType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Local">Local Budget</option>
                  <option value="International">International Budget</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Local expenses only affect Local Budget. International expenses only affect International Budget.
                </p>
              </div>

              {/* Expense Category * */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Expense Category *
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as BudgetCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {modalCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Purpose * */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="e.g. Influencer campaign payout, Billboard print and mount fee"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Amount ($ USD) * and Date * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Amount ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Affects only this month's budget</p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Invoice number, vendor name, or transaction notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Marketing Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Marketing Expense</h3>
                  <p className="text-xs text-slate-400">{editingExpense.expenseId}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="mt-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Budget Pool * */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Budget Pool *
                </label>
                <select
                  value={formPool}
                  onChange={e => setFormPool(e.target.value as BudgetType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Local">Local Budget</option>
                  <option value="International">International Budget</option>
                </select>
              </div>

              {/* Expense Category * */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Expense Category *
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as BudgetCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {modalCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Purpose * */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Amount ($ USD) * and Date * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Amount ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
