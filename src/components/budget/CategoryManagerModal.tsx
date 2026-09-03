import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { store } from '../../services/store';
import { BudgetType } from '../../types';
import { formatCurrency, toMonthDisplay } from '../../utils/budgetUtils';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetType: BudgetType;
  selectedMonth: string;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  budgetType,
  selectedMonth
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const budgetSummary = store.getBudgetSummary(budgetType, selectedMonth);
  const categoryBreakdown = store.getCategoryBreakdown(budgetType, selectedMonth);

  useEffect(() => {
    if (isOpen) {
      loadCategoryData();
    }
  }, [isOpen, budgetType, selectedMonth]);

  const loadCategoryData = () => {
    const cats = store.getCategories(budgetType, selectedMonth);
    setCategories(cats);

    const initialAlloc: Record<string, string> = {};
    const existingAlloc = budgetSummary.budgetDoc?.categoryAllocations || {};
    cats.forEach(c => {
      initialAlloc[c] = existingAlloc[c] !== undefined ? String(existingAlloc[c]) : '';
    });
    setAllocations(initialAlloc);
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingCategory(null);
  };

  if (!isOpen) return null;

  // Calculate sum of category target allocations
  const totalAllocated: number = Object.keys(allocations).reduce((sum: number, cat: string) => {
    const n = parseFloat(allocations[cat] || '0');
    return sum + (isNaN(n) || n < 0 ? 0 : n);
  }, 0);

  const handleAllocationChange = (cat: string, value: string) => {
    setAllocations(prev => ({ ...prev, [cat]: value }));
  };

  // Add new custom category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Category "${trimmed}" already exists.`);
      return;
    }

    const res = await store.addCustomCategory(budgetType, trimmed, selectedMonth);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to add category');
    } else {
      setNewCategoryName('');
      setSuccessMessage(`Category "${trimmed}" added successfully.`);
      loadCategoryData();
    }
  };

  // Rename category
  const handleStartRename = (cat: string) => {
    setEditingCategory(cat);
    setEditedName(cat);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCategory(null);
      return;
    }

    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      setErrorMessage(`Category "${trimmed}" already exists.`);
      return;
    }

    const res = await store.renameCategory(budgetType, oldName, trimmed, selectedMonth);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to rename category');
    } else {
      setSuccessMessage(`Category updated to "${trimmed}".`);
      setEditingCategory(null);
      loadCategoryData();
    }
  };

  // Delete custom category
  const handleDeleteCategory = async (cat: string) => {
    if (window.confirm(`Delete category "${cat}"?`)) {
      const res = await store.deleteCategory(budgetType, cat);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete category');
      } else {
        setSuccessMessage(`Category "${cat}" removed.`);
        loadCategoryData();
      }
    }
  };

  // Save allocations to budget
  const handleSaveAllocations = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    const cleanAlloc: Record<string, number> = {};
    Object.keys(allocations).forEach((cat: string) => {
      const num = parseFloat(allocations[cat] || '');
      if (!isNaN(num) && num > 0) {
        cleanAlloc[cat] = num;
      }
    });

    const res = await store.setCategoryAllocations(budgetType, selectedMonth, cleanAlloc);
    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save category allocations');
    } else {
      setSuccessMessage('Category target allocations saved successfully.');
      setTimeout(() => {
        onClose();
      }, 600);
    }
  };

  const standardCategories = ['Influencers', 'Billboards', 'LCD Screens', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Manage Categories & Target Allocations
              </h3>
              <p className="text-xs text-slate-400">
                {budgetType} Budget • {toMonthDisplay(selectedMonth)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="mt-4 overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Monthly Budget Summary Banner */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Total Monthly Budget:</span>{' '}
              <span className="font-bold text-white text-sm">
                {formatCurrency(budgetSummary.totalBudget)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Target Allocations Sum:</span>{' '}
              <span className={`font-bold text-sm ${totalAllocated > budgetSummary.totalBudget && budgetSummary.totalBudget > 0 ? 'text-rose-400' : 'text-indigo-300'}`}>
                {formatCurrency(totalAllocated)}
              </span>
            </div>
            {budgetSummary.totalBudget > 0 && (
              <div>
                <span className="text-slate-400">Unallocated:</span>{' '}
                <span className={`font-semibold text-xs ${budgetSummary.totalBudget - totalAllocated < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {formatCurrency(budgetSummary.totalBudget - totalAllocated)}
                </span>
              </div>
            )}
          </div>

          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="New category name (e.g. Digital Ads, Print Media, Events)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Categories & Target Spending Limits
            </label>

            <div className="space-y-2">
              {categories.map(cat => {
                const isStandard = standardCategories.includes(cat);
                const isEditing = editingCategory === cat;
                const catData = categoryBreakdown[cat] || { spent: 0, count: 0 };

                return (
                  <div
                    key={cat}
                    className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Category Name / Edit */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editedName}
                            onChange={e => setEditedName(e.target.value)}
                            className="bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-white text-xs flex-1 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(cat)}
                            className="p-1 text-emerald-400 hover:bg-slate-700 rounded"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs">{cat}</span>
                            {isStandard ? (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                System
                              </span>
                            ) : (
                              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartRename(cat)}
                              title="Rename Category"
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {!isStandard && (
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                title="Delete Custom Category"
                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actual Spend & Target Allocation Input */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="text-slate-400 text-[11px] block">Actual Spent:</span>
                        <span className="font-semibold text-white">
                          {formatCurrency(catData.spent)}
                        </span>
                      </div>

                      <div className="w-36">
                        <label className="text-[11px] text-slate-400 block mb-0.5">
                          Target Budget ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Optional"
                            value={allocations[cat] ?? ''}
                            onChange={e => handleAllocationChange(cat, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAllocations}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Category Allocations'}
          </button>
        </div>
      </div>
    </div>
  );
};
