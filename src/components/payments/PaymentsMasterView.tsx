import React, { useState } from 'react';
import { CreditCard, Search, ShieldAlert, CheckCircle2, Clock, Filter, FileText, CheckSquare, Square, Trash2, CalendarCheck, Edit2, AlertTriangle, X, HelpCircle, Check, Download, FileSpreadsheet } from 'lucide-react';
import { store } from '../../services/store';
import { CentralPayment, CentralPaymentStatus } from '../../types';
import * as XLSX from 'xlsx';

interface PaymentsMasterViewProps {
  initialFilter?: 'All' | 'Pending' | 'Approved' | 'Paid';
}

export const PaymentsMasterView: React.FC<PaymentsMasterViewProps> = ({ initialFilter = 'All' }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Paid'>(initialFilter);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Modal & Generation States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [generationSummary, setGenerationSummary] = useState<{ success: boolean; generated: number; skipped: number; show: boolean } | null>(null);

  // Edit Payment States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CentralPayment | null>(null);

  // Edit form fields
  const [editRecipient, setEditRecipient] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<CentralPaymentStatus>('Unpaid');
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentReference, setEditPaymentReference] = useState('');

  const payments = store.getPayments();
  const canApprove = store.hasPermission('influencer_payments' as any, 'approve') || store.hasPermission('billboard_payments' as any, 'approve');

  const filtered = payments.filter(p => {
    const matchesSearch =
      p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
      p.recipient.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType === 'All' || p.paymentType === selectedType;

    if (activeTab === 'Pending') return matchesSearch && matchesType && (p.status === 'Pending Approval' || p.status === 'Unpaid');
    if (activeTab === 'Approved') return matchesSearch && matchesType && p.status === 'Approved';
    if (activeTab === 'Paid') return matchesSearch && matchesType && p.status === 'Paid';
    return matchesSearch && matchesType;
  });

  const isAllSelected = filtered.length > 0 && filtered.every(p => selectedIds.includes(p.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteOne = async (id: string, paymentIdStr: string) => {
    if (!canApprove) {
      setPermissionError('Permission denied: Account cannot delete payment records');
      return;
    }
    if (confirm(`Are you sure you want to delete payment record ${paymentIdStr}?`)) {
      const res = await store.deletePayment(id);
      if (!res.success) {
        setPermissionError(res.error || 'Failed to delete payment record');
      } else {
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canApprove) return;
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected payment record(s)?`)) {
      const res = await store.bulkDeletePayments(selectedIds);
      if (res.success) {
        setSelectedIds([]);
      } else {
        setPermissionError(res.error || 'Failed to bulk delete payments');
      }
    }
  };

  const handleBulkStatus = async (nextStatus: CentralPaymentStatus) => {
    if (!canApprove) {
      setPermissionError('Permission denied: Account cannot approve or disburse payments');
      return;
    }
    if (selectedIds.length === 0) return;
    const res = await store.bulkUpdatePaymentStatus(selectedIds, nextStatus);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to bulk update payment status');
    }
  };

  const handleUpdateStatus = (payment: CentralPayment, nextStatus: CentralPaymentStatus) => {
    if ((nextStatus === 'Approved' || nextStatus === 'Paid') && !canApprove) {
      setPermissionError(`Permission denied: Account "${store.getCurrentUser().fullName}" cannot approve or mark payments as Paid.`);
      return;
    }

    const res = store.updatePaymentStatus(payment.id, nextStatus);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to update payment status');
    }
  };

  // Trigger Month Closures
  const handleGeneratePayments = async () => {
    if (!canApprove) {
      setPermissionError('Permission denied: You do not have permission to run month close operations.');
      return;
    }
    const res = await store.generateMonthlyPayments(selectedMonth);
    if (res.success) {
      setGenerationSummary({
        success: true,
        generated: res.generated,
        skipped: res.skipped,
        show: true
      });
      setIsGenerateModalOpen(false);
    } else {
      setPermissionError(res.error || 'Failed to generate monthly payments.');
    }
  };

  // Start Editing Payment details
  const handleStartEdit = (payment: CentralPayment) => {
    setEditingPayment(payment);
    setEditRecipient(payment.recipient);
    setEditReference(payment.reference);
    setEditAmount(payment.amount);
    setEditDueDate(payment.dueDate);
    setEditStatus(payment.status);
    setEditNotes(payment.notes || '');
    setEditPaymentMethod(payment.paymentMethod || '');
    setEditPaymentReference(payment.paymentReference || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    if ((editStatus === 'Approved' || editStatus === 'Paid') && !canApprove) {
      setPermissionError('Permission denied: You do not have approval rights to change status to Approved or Paid.');
      return;
    }

    const updates: Partial<CentralPayment> = {
      recipient: editRecipient,
      reference: editReference,
      amount: editAmount,
      dueDate: editDueDate,
      status: editStatus,
      notes: editNotes,
    };

    if (editStatus === 'Paid') {
      updates.paymentDate = new Date().toISOString().split('T')[0];
      updates.paymentMethod = editPaymentMethod || 'Bank Transfer';
      updates.paymentReference = editPaymentReference || `TXN-${Date.now()}`;
    }

    const res = await store.updatePayment(editingPayment.id, updates);
    if (res.success) {
      setIsEditModalOpen(false);
      setEditingPayment(null);
    } else {
      setPermissionError(res.error || 'Failed to update payment details.');
    }
  };

  // Helper: Count active entities to be generated for selected month
  const getActiveEntitiesSummary = () => {
    const monthsMap: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const parts = selectedMonth.split(' ');
    const monthName = parts[0];
    const year = parts[1] || '2026';
    const monthNum = monthsMap[monthName] || '08';
    const startStr = `${year}-${monthNum}-01`;
    const daysInMonth = new Date(Number(year), Number(monthNum), 0).getDate();
    const endStr = `${year}-${monthNum}-${daysInMonth}`;

    const activeBillboards = store.getBillboards().filter(b => b.status === 'Active' && b.agreementStart <= endStr && b.agreementEnd >= startStr);
    const activeLcd = store.getLCDScreens().filter(l => l.status === 'Active' && l.agreementStart <= endStr && l.agreementEnd >= startStr);
    const activeInfluencers = store.getInfluencers().filter(i => i.status === 'Active' && i.agreementStart <= endStr && i.agreementEnd >= startStr);

    const bbTotal = activeBillboards.reduce((acc, curr) => acc + curr.rentPrice, 0);
    const lcdTotal = activeLcd.reduce((acc, curr) => acc + curr.rentPrice, 0);
    const infTotal = activeInfluencers.reduce((acc, curr) => acc + curr.salary, 0);

    return {
      billboards: activeBillboards.length,
      bbTotal,
      lcdScreens: activeLcd.length,
      lcdTotal,
      influencers: activeInfluencers.length,
      infTotal,
      totalSum: bbTotal + lcdTotal + infTotal
    };
  };

  const activeSum = getActiveEntitiesSummary();

  const getExportData = () => {
    return filtered.map(pay => ({
      'Payment ID': pay.paymentId,
      'Recipient': pay.recipient,
      'Type': pay.paymentType,
      'Reference / Period': pay.reference,
      'Amount (USD)': pay.amount,
      'Due Date': pay.dueDate,
      'Status': pay.status,
      'Payment Date': pay.paymentDate || 'N/A',
      'Payment Method': pay.paymentMethod || 'N/A',
      'Transaction Ref': pay.paymentReference || 'N/A',
      'Notes': pay.notes || '',
      'Created Date': pay.createdAt || 'N/A'
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Central Payments');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Central_Payments_${dateStr}.xlsx`);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Central Payments');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Central_Payments_${dateStr}.csv`, { bookType: 'csv' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Central Payments Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Consolidated cash disbursement control across Influencers, Outdoor Billboards, & LCD venue leases</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export to CSV (.csv)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          {canApprove && (
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Complete Month Operations</span>
            </button>
          )}
        </div>
      </div>

      {permissionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button onClick={() => setPermissionError(null)} className="text-rose-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Generation success banner */}
      {generationSummary?.show && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl text-xs text-emerald-300 flex items-start justify-between shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-emerald-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
              <Check className="w-4 h-4 font-black" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Monthly Obligations Generated Successfully!</h4>
              <p className="text-slate-300 mt-1">
                Generated <strong>{generationSummary.generated}</strong> new pending payments for month-end reconciliation.
                Skipped <strong>{generationSummary.skipped}</strong> records that were already registered to avoid duplicates.
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">All new payments have been logged as <strong>Pending Approval</strong>. Admin review is required before execution.</p>
            </div>
          </div>
          <button onClick={() => setGenerationSummary(prev => prev ? { ...prev, show: false } : null)} className="text-emerald-400 hover:text-white font-bold text-base px-1">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 font-semibold text-xs">
        {(['All', 'Pending', 'Approved', 'Paid'] as const).map(tab => {
          const count = payments.filter(p => {
            if (tab === 'Pending') return p.status === 'Pending Approval' || p.status === 'Unpaid';
            if (tab === 'Approved') return p.status === 'Approved';
            if (tab === 'Paid') return p.status === 'Paid';
            return true;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedIds([]);
              }}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === tab
                  ? 'border-emerald-400 text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab === 'All' ? 'All Payments' : tab}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === tab ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedIds.length} payment record(s) selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canApprove && (
              <>
                <button
                  onClick={() => handleBulkStatus('Approved')}
                  className="px-3 py-1.5 bg-sky-900/60 hover:bg-sky-900 text-sky-200 border border-sky-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Bulk Approve</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('Paid')}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bulk Execute Payment</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bulk Delete ({selectedIds.length})</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search payment ID, recipient, ref..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Influencer">Influencer Retainer</option>
            <option value="Billboard">Billboard Outdoor</option>
            <option value="LCD Screen">LCD Screen Lease</option>
            <option value="Other Marketing Expense">Other Expenses</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-10">
                  <button 
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Module Type</th>
                <th className="py-3 px-4 font-semibold">Recipient</th>
                <th className="py-3 px-4 font-semibold">Reference / Notes</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Due Date</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">No payment records found matching the active filters.</td>
                </tr>
              ) : (
                filtered.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-3.5 px-4">
                        <button 
                          onClick={() => handleSelectOne(p.id)}
                          className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.paymentId}</td>
                      <td className="py-3.5 px-4 font-semibold text-amber-300">{p.paymentType}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{p.recipient}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold">{p.reference}</div>
                        {p.notes && <div className="text-[11px] text-slate-400 mt-0.5 italic">{p.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">${p.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{p.dueDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : p.status === 'Approved'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : p.status === 'Pending Approval' || p.status === 'Unpaid'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(p.status === 'Unpaid' || p.status === 'Pending Approval') && (
                            <button
                              onClick={() => handleUpdateStatus(p, 'Approved')}
                              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {p.status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(p, 'Paid')}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          )}

                          {canApprove && (
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 ml-1 cursor-pointer border border-slate-800 bg-slate-900"
                              title="Edit Details / Keep Pending"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canApprove && (
                            <button
                              onClick={() => handleDeleteOne(p.id, p.paymentId)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer border border-slate-800 bg-slate-900"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Month Closure Dialog */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsGenerateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-base"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <CalendarCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Generate Monthly Operational Payments</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Select an active operations month to trigger mass payment generation for contract agreements.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reconciliation Month *</label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
                >
                  {['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Real-time Dynamic Estimation Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Dynamic Generation Preview ({selectedMonth})</h4>
                <div className="divide-y divide-slate-800/50 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between pt-1.5">
                    <span>Active Billboards ({activeSum.billboards}):</span>
                    <span className="font-mono font-bold text-white">${activeSum.bbTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span>Active LCD Screens ({activeSum.lcdScreens}):</span>
                    <span className="font-mono font-bold text-white">${activeSum.lcdTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span>Active Influencers ({activeSum.influencers}):</span>
                    <span className="font-mono font-bold text-white">${activeSum.infTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 text-white font-bold text-sm">
                    <span className="text-emerald-400">Total Pending Sum:</span>
                    <span className="font-mono text-emerald-400">${activeSum.totalSum.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[10.5px] text-slate-400 leading-normal bg-amber-950/20 border border-amber-900/40 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Idempotency Rule Active:</strong> The generation algorithm automatically skips any entities that already have registered payments for <strong>{selectedMonth}</strong> to avoid double payments.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePayments}
                  className="px-4 py-2 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/15"
                >
                  <span>Generate Obligations</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Dialog */}
      {isEditModalOpen && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPayment(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-base"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Edit2 className="w-4 h-4" />
              <h3 className="text-base font-bold text-white">Review & Edit Payment details</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Review agreement obligations, alter payment parameters, or update disburse status.</p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment ID</label>
                  <input
                    type="text"
                    disabled
                    value={editingPayment.paymentId}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Type</label>
                  <input
                    type="text"
                    disabled
                    value={editingPayment.paymentType}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={editRecipient}
                    onChange={e => setEditRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Reference/Period *</label>
                  <input
                    type="text"
                    required
                    value={editReference}
                    onChange={e => setEditReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Amount ($ USD) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editAmount}
                    onChange={e => setEditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Due Date *</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Disbursement Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as CentralPaymentStatus)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold"
                >
                  <option value="Unpaid">Unpaid (Pending Approval)</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid (Disbursed)</option>
                </select>
              </div>

              {editStatus === 'Paid' && (
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
                  <h4 className="text-[10.5px] uppercase tracking-wider text-emerald-400 font-bold">Disbursement Reference Parameters</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Disbursement Method *</label>
                      <input
                        type="text"
                        required
                        value={editPaymentMethod}
                        onChange={e => setEditPaymentMethod(e.target.value)}
                        placeholder="e.g. Hormuud EVC Plus"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Transaction Ref/No. *</label>
                      <input
                        type="text"
                        required
                        value={editPaymentReference}
                        onChange={e => setEditPaymentReference(e.target.value)}
                        placeholder="e.g. TXN-982189A"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Audit Notes / Descriptions</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Additional contract or transaction descriptions..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingPayment(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
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
