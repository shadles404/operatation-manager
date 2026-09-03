import React, { useState, useEffect } from 'react';
import {
  Globe,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Plus,
  Calendar,
  DollarSign,
  PieChart,
  Trash2,
  Users,
  Tv,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  FolderKanban
} from 'lucide-react';
import { store } from '../../services/store';
import { Expense } from '../../types';
import { CategoryManagerModal } from './CategoryManagerModal';
import {
  getCurrentMonthKey,
  toMonthDisplay,
  toMonthKey,
  formatCurrency,
  getSelectableMonths,
  getTodayDate,
  STANDARD_EXPENSE_CATEGORIES
} from '../../utils/budgetUtils';

export const InternationalBudgetView: React.FC = () => {
  const [, setTick] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [isSetBudgetModalOpen, setIsSetBudgetModalOpen] = useState(false);
  const [isLogExpenseModalOpen, setIsLogExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Set Budget Form State
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Log Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<string>('Influencers');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(getTodayDate());
  const [expenseNotes, setExpenseNotes] = useState<string>('');
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Subscribe to store updates (Firestore sync, expense changes, etc.)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const currentUser = store.getCurrentUser();
  const canManage = store.hasPermission('budget', 'update') || currentUser?.role === 'admin';
  const canAddExpense = store.hasPermission('expenses', 'add') || store.hasPermission('budget', 'add') || currentUser?.role === 'admin';

  // Get real database budget summary and category breakdown for International pool in selected month
  const summary = store.getBudgetSummary('International', selectedMonth);
  const categoryBreakdown = store.getCategoryBreakdown('International', selectedMonth);
  const availableCategories = store.getCategories('International', selectedMonth);

  // Filter actual DB expenses for International pool and selected month
  const monthExpenses = store.getExpenses().filter(
    e => e.budgetType === 'International' && toMonthKey(e.date) === selectedMonth
  );

  const monthOptions = getSelectableMonths(2026);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevKey);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextKey);
  };

  // Open Set Budget Modal
  const handleOpenSetBudget = () => {
    setBudgetInput(summary.totalBudget > 0 ? String(summary.totalBudget) : '');
    setBudgetError(null);
    setIsSetBudgetModalOpen(true);
  };

  // Save Monthly Budget to Firestore
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetInput);
    if (isNaN(num) || num < 0) {
      setBudgetError('Please enter a valid non-negative budget amount.');
      return;
    }

    setIsSavingBudget(true);
    setBudgetError(null);
    const res = await store.setMonthlyBudget('International', selectedMonth, num);
    setIsSavingBudget(false);

    if (!res.success) {
      setBudgetError(res.error || 'Failed to save budget.');
    } else {
      setIsSetBudgetModalOpen(false);
    }
  };

  // Open Log Expense Modal
  const handleOpenLogExpense = () => {
    setExpenseCategory('Influencers');
    setExpenseDesc('');
    setExpenseAmount('');
    const today = getTodayDate();
    setExpenseDate(toMonthKey(today) === selectedMonth ? today : `${selectedMonth}-01`);
    setExpenseNotes('');
    setExpenseError(null);
    setIsLogExpenseModalOpen(true);
  };

  // Save Logged Expense to Firestore
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim()) {
      setExpenseError('Please provide a description or purpose for this expense.');
      return;
    }
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseError('Please enter a valid expense amount greater than $0.');
      return;
    }
    if (!expenseDate) {
      setExpenseError('Please select an expense date.');
      return;
    }

    setIsSavingExpense(true);
    setExpenseError(null);

    const res = await store.addExpense({
      budgetType: 'International',
      category: expenseCategory,
      description: expenseDesc.trim(),
      amount: amt,
      date: expenseDate,
      notes: expenseNotes.trim()
    });

    setIsSavingExpense(false);

    if (!res.success) {
      setExpenseError(res.error || 'Failed to record expense.');
    } else {
      const expMonth = toMonthKey(expenseDate);
      if (expMonth !== selectedMonth) {
        setSelectedMonth(expMonth);
      }
      setIsLogExpenseModalOpen(false);
    }
  };

  const handleDeleteExpense = async (exp: Expense) => {
    if (window.confirm(`Delete expense "${exp.description}" ($${exp.amount.toLocaleString()})? The amount will be returned to the budget.`)) {
      await store.deleteExpense(exp.id);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Influencers':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'Billboards':
        return <Layers className="w-5 h-5 text-amber-400" />;
      case 'LCD Screens':
        return <Tv className="w-5 h-5 text-cyan-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCategorySubtitle = (cat: string) => {
    switch (cat) {
      case 'Influencers':
        return 'Global influencer partnerships, international travel & cross-border talent';
      case 'Billboards':
        return 'International prime outdoor billboards, times square & high-impact transit';
      case 'LCD Screens':
        return 'Global digital DOOH screens, airport video networks & terminal broadcasts';
      default:
        return 'International production, localization, translation, agencies & global activations';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">International Marketing Budget</h1>
              <p className="text-sm text-slate-400">
                Track and manage international marketing/production expenses (Influencers, Billboards, LCD Screens, Other)
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1">
              <Calendar className="w-4 h-4 text-purple-400" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
              >
                {monthOptions.map(opt => (
                  <option key={opt.key} value={opt.key} className="bg-slate-800 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {canManage && (
            <>
              <button
                onClick={handleOpenSetBudget}
                className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>{summary.hasBudgetConfigured ? 'Edit Monthly Budget' : 'Set Monthly Budget'}</span>
              </button>

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                title="Edit and update expense categories and targets"
              >
                <FolderKanban className="w-4 h-4 text-purple-400" />
                <span>Edit Categories</span>
              </button>
            </>
          )}

          {canAddExpense && (
            <button
              onClick={handleOpenLogExpense}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log International Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning Notice if budget exceeded */}
      {summary.totalBudget > 0 && summary.remaining < 0 && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-rose-200">Budget Limit Exceeded:</span> Total recorded international expenses ({formatCurrency(summary.spent)}) have exceeded the configured monthly budget of {formatCurrency(summary.totalBudget)} for {toMonthDisplay(selectedMonth)} by {formatCurrency(Math.abs(summary.remaining))}.
          </div>
        </div>
      )}

      {/* KPI Cards: Dynamic from Database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Budget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Budget</span>
            <div className="p-2 bg-slate-800 rounded-lg text-purple-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {summary.hasBudgetConfigured ? formatCurrency(summary.totalBudget) : '$0'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{toMonthDisplay(selectedMonth)}</span>
              {summary.hasBudgetConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="text-amber-400">Not set by admin</span>
              )}
            </div>
          </div>
        </div>

        {/* Actual Recorded Expenses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actual Recorded Expenses</span>
            <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary.spent)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{summary.expenseCount} recorded {summary.expenseCount === 1 ? 'expense' : 'expenses'}</span>
              <span className="text-slate-400 font-medium">{summary.utilization}% of budget</span>
            </div>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining Budget</span>
            <div className={`p-2 bg-slate-800 rounded-lg ${summary.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${summary.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(summary.remaining)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Monthly Budget − Recorded Expenses
            </div>
          </div>
        </div>

        {/* Budget Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Health</span>
            <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                summary.warningLevel === 'Exceeded'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : summary.warningLevel === 'Critical'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : summary.warningLevel === 'Warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {summary.warningLevel === 'Exceeded' ? 'Exceeded' :
                 summary.warningLevel === 'Critical' ? 'Critical (>90%)' :
                 summary.warningLevel === 'Warning' ? 'Warning (>80%)' : 'Healthy'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  summary.utilization >= 100 ? 'bg-rose-500' :
                  summary.utilization >= 90 ? 'bg-orange-500' :
                  summary.utilization >= 80 ? 'bg-amber-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, summary.utilization)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">International Category Breakdown ({toMonthDisplay(selectedMonth)})</h2>
            <span className="text-xs text-slate-400">Separated by real database records & target allocations</span>
          </div>
          {canManage && (
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="self-start sm:self-auto text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Edit / Update Categories & Targets</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableCategories.map(cat => {
            const data = categoryBreakdown[cat] || {
              spent: 0,
              count: 0,
              targetAllocation: 0,
              shareOfExpenses: 0,
              shareOfBudget: 0,
              allocationUtilization: 0
            };
            const hasTarget = data.targetAllocation > 0;

            return (
              <div key={cat} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-800 rounded-lg">
                        {getCategoryIcon(cat)}
                      </div>
                      <span className="font-semibold text-white text-sm truncate max-w-[120px]" title={cat}>{cat}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {data.count} {data.count === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {getCategorySubtitle(cat)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">{formatCurrency(data.spent)}</span>
                    <span className="text-xs text-slate-400">{data.shareOfExpenses}% of spend</span>
                  </div>

                  {hasTarget ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Target: {formatCurrency(data.targetAllocation)}</span>
                        <span className={data.allocationUtilization > 100 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                          {data.allocationUtilization}% used
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            data.allocationUtilization > 100
                              ? 'bg-rose-500'
                              : data.allocationUtilization > 85
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.min(100, data.allocationUtilization)}%` }}
                        />
                      </div>
                    </div>
                  ) : summary.totalBudget > 0 ? (
                    <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, data.shareOfBudget)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recorded Expenses Table for Selected Month */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Recorded International Expenses ({toMonthDisplay(selectedMonth)})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Only real recorded expenses stored in the database affect the {toMonthDisplay(selectedMonth)} budget
            </p>
          </div>
          {canAddExpense && (
            <button
              onClick={handleOpenLogExpense}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium self-start sm:self-auto transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </button>
          )}
        </div>

        {monthExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No International Expenses Recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              There are no expenses recorded for International Budget in {toMonthDisplay(selectedMonth)}. All budget calculations reflect live database records.
            </p>
            {canAddExpense && (
              <button
                onClick={handleOpenLogExpense}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log International Expense</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Expense ID</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Description / Purpose</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold">Recorded By</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {monthExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-purple-400 font-medium">
                      {exp.expenseId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
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
                      {canManage && (
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          title="Delete Expense"
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set Monthly Budget Modal */}
      {isSetBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Set International Monthly Budget</h3>
                  <p className="text-xs text-slate-400">{toMonthDisplay(selectedMonth)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSetBudgetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-5 space-y-4">
              {budgetError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                  {budgetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Monthly Total Budget ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  This value is saved in Firestore and sets the total allowed international marketing spend for {toMonthDisplay(selectedMonth)}.
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Recorded Spend:</span>
                  <span className="font-medium text-white">{formatCurrency(summary.spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Remaining:</span>
                  <span className="font-medium text-emerald-400">
                    {formatCurrency(Math.max(0, (parseFloat(budgetInput) || 0) - summary.spent))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSetBudgetModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSavingBudget ? 'Saving to Database...' : 'Save Monthly Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Marketing Expense Modal */}
      {isLogExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Log International Marketing Expense</h3>
                  <p className="text-xs text-slate-400">Record a real expenditure against International Budget</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-5 space-y-4">
              {expenseError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                  {expenseError}
                </div>
              )}

              {/* Budget Pool (Fixed to International Budget) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Budget Pool *
                </label>
                <input
                  type="text"
                  disabled
                  value="International Budget"
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3.5 py-2 text-slate-300 text-sm font-medium cursor-not-allowed"
                />
              </div>

              {/* Expense Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Expense Category *
                </label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {availableCategories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Purpose */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Global Billboard placement, International talent fee, etc."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Amount & Date */}
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
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
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
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes / Reference (Optional)
                </label>
                <textarea
                  rows={2}
                  value={expenseNotes}
                  onChange={e => setExpenseNotes(e.target.value)}
                  placeholder="Invoice number, vendor name, or international contract reference..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogExpenseModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingExpense}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSavingExpense ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        budgetType="International"
        selectedMonth={selectedMonth}
      />
    </div>
  );
};
