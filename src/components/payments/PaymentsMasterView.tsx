import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  CheckSquare,
  Square,
  Trash2,
  CalendarCheck,
  Edit2,
  AlertTriangle,
  X,
  Plus,
  HelpCircle,
  Check,
  Download,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  CalendarDays,
  PartyPopper
} from 'lucide-react';
import { store } from '../../services/store';
import { CentralPayment, CentralPaymentStatus, CentralPaymentType } from '../../types';
import * as XLSX from 'xlsx';
import { getCurrentMonthKey, toMonthDisplay, toMonthKey } from '../../utils/budgetUtils';

interface PaymentsMasterViewProps {
  initialFilter?: 'All' | 'Unpaid' | 'Pending' | 'Approved' | 'Paid';
}

export const PaymentsMasterView: React.FC<PaymentsMasterViewProps> = ({ initialFilter = 'All' }) => {
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthDisplay = toMonthDisplay(currentMonthKey);
  const availableMonths = store.getAvailableMonths();

  const [activeTab, setActiveTab] = useState<'All' | 'Unpaid' | 'Pending' | 'Approved' | 'Paid'>(initialFilter);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [cycleSuccessMessage, setCycleSuccessMessage] = useState<string | null>(null);

  // Modal & Generation States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genTargetMonth, setGenTargetMonth] = useState(currentMonthDisplay);
  const [generationSummary, setGenerationSummary] = useState<{ success: boolean; generated: number; skipped: number; show: boolean } | null>(null);

  // New / Event Payment Modal States
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [newPayType, setNewPayType] = useState<CentralPaymentType>('Event');
  const [newPayRecipient, setNewPayRecipient] = useState('');
  const [newPayPhone, setNewPayPhone] = useState('');
  const [newPayReference, setNewPayReference] = useState('');
  const [newPayAmount, setNewPayAmount] = useState<number>(0);
  const [newPayDueDate, setNewPayDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newPayStatus, setNewPayStatus] = useState<CentralPaymentStatus>('Unpaid');
  const [newPayBudgetType, setNewPayBudgetType] = useState<'Local' | 'International'>('Local');
  const [newPayNotes, setNewPayNotes] = useState('');
  const [newPayMethod, setNewPayMethod] = useState('');
  const [newPayRefNo, setNewPayRefNo] = useState('');

  // Edit Payment States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CentralPayment | null>(null);

  // Edit form fields
  const [editRecipient, setEditRecipient] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<CentralPaymentStatus>('Unpaid');
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentReference, setEditPaymentReference] = useState('');

  const payments = store.getPayments();
  const canApprove = store.hasPermission('influencer_payments' as any, 'approve') || store.hasPermission('billboard_payments' as any, 'approve') || store.getCurrentUser()?.role === 'admin';

  const activeMonthDisplay = selectedMonth === 'All' ? 'All Months' : toMonthDisplay(selectedMonth);

  // Filter payments
  const filtered = payments.filter(p => {
    const matchesSearch =
      p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
      p.recipient.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'All' || p.paymentType === selectedType;

    const matchesMonth =
      selectedMonth === 'All' ||
      toMonthKey(p.dueDate || '') === selectedMonth ||
      toMonthKey(p.createdAt || '') === selectedMonth ||
      p.reference.toLowerCase().includes(activeMonthDisplay.toLowerCase()) ||
      p.reference.includes(selectedMonth);

    if (activeTab === 'Unpaid') return matchesSearch && matchesType && matchesMonth && p.status === 'Unpaid';
    if (activeTab === 'Pending') return matchesSearch && matchesType && matchesMonth && p.status === 'Pending Approval';
    if (activeTab === 'Approved') return matchesSearch && matchesType && matchesMonth && p.status === 'Approved';
    if (activeTab === 'Paid') return matchesSearch && matchesType && matchesMonth && p.status === 'Paid';

    return matchesSearch && matchesType && matchesMonth;
  });

  // Calculate high-level KPIs for active cycle / filter
  const totalAmountFiltered = filtered.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = filtered.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalApproved = filtered.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filtered.filter(p => p.status === 'Pending Approval').reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = filtered.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + p.amount, 0);

  // Event specific KPIs
  const eventPayments = filtered.filter(p => p.paymentType === 'Event');
  const eventPaidCount = eventPayments.filter(p => p.status === 'Paid').length;
  const eventPendingCount = eventPayments.filter(p => p.status === 'Pending Approval' || p.status === 'Approved').length;
  const eventUnpaidCount = eventPayments.filter(p => p.status === 'Unpaid').length;

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
      setPermissionError(`Permission denied: Account "${store.getCurrentUser()?.fullName}" cannot approve or mark payments as Paid.`);
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
    const res = await store.generateMonthlyPayments(genTargetMonth);
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

  // Start fresh September cycle
  const handleStartFreshSeptemberCycle = async () => {
    if (!canApprove) {
      setPermissionError('Permission denied: Only Administrators can initialize monthly cycles.');
      return;
    }
    if (confirm('Start fresh September 2026 cycle?\n\n- All influencer profiles & permanent records will be kept intact.\n- August data will be preserved as historical records.\n- September targets will start fresh (0 completed videos) and payments reset to $0 paid.')) {
      const res = await store.startFreshSeptemberCycle();
      if (res.success) {
        setSelectedMonth('2026-09');
        setCycleSuccessMessage(res.message || 'September 2026 cycle initialized successfully!');
      } else {
        setPermissionError(res.error || 'Failed to initialize fresh September cycle');
      }
    }
  };

  // Create New Payment / Event Payment
  const handleCreateNewPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayRecipient.trim() || newPayAmount <= 0) {
      setPermissionError('Please provide a valid recipient and payment amount.');
      return;
    }

    let prefix = 'PAY';
    if (newPayType === 'Event') prefix = 'EVT';
    else if (newPayType === 'Influencer') prefix = 'INF';
    else if (newPayType === 'Billboard') prefix = 'BB';
    else if (newPayType === 'LCD Screen') prefix = 'LCD';
    else prefix = 'EXP';

    const payId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await store.addPayment({
      paymentId: payId,
      paymentType: newPayType,
      recipient: newPayRecipient.trim(),
      recipientPhone: newPayPhone.trim() || undefined,
      reference: newPayReference.trim() || `${newPayType} Payment - ${toMonthDisplay(toMonthKey(newPayDueDate))}`,
      amount: newPayAmount,
      currency: 'USD',
      dueDate: newPayDueDate,
      status: newPayStatus,
      budgetType: newPayBudgetType,
      notes: newPayNotes.trim() || undefined,
      paymentMethod: newPayStatus === 'Paid' ? (newPayMethod || 'Bank Transfer') : undefined,
      paymentReference: newPayStatus === 'Paid' ? (newPayRefNo || `TXN-${Date.now()}`) : undefined,
      paymentDate: newPayStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
    });

    if (res.success) {
      setIsNewPaymentModalOpen(false);
      // Reset form
      setNewPayRecipient('');
      setNewPayPhone('');
      setNewPayReference('');
      setNewPayAmount(0);
      setNewPayStatus('Unpaid');
      setNewPayNotes('');
      setNewPayMethod('');
      setNewPayRefNo('');
    } else {
      setPermissionError(res.error || 'Failed to create payment record');
    }
  };

  // Start Editing Payment details
  const handleStartEdit = (payment: CentralPayment) => {
    setEditingPayment(payment);
    setEditRecipient(payment.recipient);
    setEditPhone(payment.recipientPhone || (payment.paymentType === 'Influencer' ? store.getInfluencerPhone(payment) : ''));
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
      recipientPhone: editPhone.trim() || undefined,
      reference: editReference,
      amount: editAmount,
      dueDate: editDueDate,
      status: editStatus,
      notes: editNotes,
    };

    if (editStatus === 'Paid') {
      updates.paymentDate = editingPayment.paymentDate || new Date().toISOString().split('T')[0];
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
    const parts = genTargetMonth.split(' ');
    const monthName = parts[0];
    const year = parts[1] || '2026';
    const monthNum = monthsMap[monthName] || '09';
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
    return filtered.map(pay => {
      const phone = pay.recipientPhone || (pay.paymentType === 'Influencer' ? store.getInfluencerPhone(pay) : 'N/A');
      return {
        'Payment ID': pay.paymentId,
        'Recipient': pay.recipient,
        'Phone Number': phone,
        'Payment Type': pay.paymentType,
        'Reference / Period': pay.reference,
        'Amount (USD)': pay.amount,
        'Due Date': pay.dueDate,
        'Status': pay.status,
        'Payment Date': pay.paymentDate || 'N/A',
        'Payment Method': pay.paymentMethod || 'N/A',
        'Transaction Ref': pay.paymentReference || 'N/A',
        'Budget Pool': pay.budgetType || 'Local',
        'Notes': pay.notes || '',
        'Created Date': pay.createdAt || 'N/A'
      };
    });
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Central Payments');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Central_Payments_${selectedMonth}_${dateStr}.xlsx`);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Central Payments');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Central_Payments_${selectedMonth}_${dateStr}.csv`, { bookType: 'csv' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Central Payments Ledger</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              selectedMonth === currentMonthKey
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {selectedMonth === currentMonthKey ? 'Active Cycle: ' : ''}{activeMonthDisplay}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated cash disbursement control across Influencers, Outdoor Billboards, LCD Screens, & Event Payments
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cycle Switcher */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 font-medium">Cycle:</span>
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
                setSelectedIds([]);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {toMonthDisplay(m)} {m === currentMonthKey ? '★ (Active)' : ''}
                </option>
              ))}
              <option value="All" className="bg-slate-900 text-white">All Months (All-Time Ledger)</option>
            </select>
          </div>

          <button
            onClick={() => setIsNewPaymentModalOpen(true)}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment / Event</span>
          </button>

          {canApprove && (
            <button
              onClick={handleStartFreshSeptemberCycle}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-600/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset September cycle fresh (preserves August historical records)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fresh Sept Cycle</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export to CSV (.csv)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>CSV</span>
          </button>

          {canApprove && (
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Batch generate recurring obligations"
            >
              <CalendarCheck className="w-4 h-4 text-sky-400" />
              <span>Generate Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Cycle success alert */}
      {cycleSuccessMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cycleSuccessMessage}</span>
          </div>
          <button onClick={() => setCycleSuccessMessage(null)} className="text-emerald-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {permissionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button onClick={() => setPermissionError(null)} className="text-rose-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Ledger</span>
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-white mt-1 font-mono">${totalAmountFiltered.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filtered.length} total payments</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Disbursed (Paid)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1 font-mono">${totalPaid.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filtered.filter(p => p.status === 'Paid').length} completed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Approved (Ready)</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-400 mt-1 font-mono">${totalApproved.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filtered.filter(p => p.status === 'Approved').length} ready for payout</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Pending & Unpaid</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 mt-1 font-mono">${(totalPending + totalUnpaid).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filtered.filter(p => p.status === 'Pending Approval' || p.status === 'Unpaid').length} awaiting action</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Event Payments</span>
            <PartyPopper className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 mt-1 font-mono">{eventPayments.length} <span className="text-xs text-slate-400 font-normal">Events</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="text-emerald-400">{eventPaidCount} Paid</span>
            <span>•</span>
            <span className="text-amber-400">{eventPendingCount} Pending</span>
            <span>•</span>
            <span className="text-rose-400">{eventUnpaidCount} Unpaid</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 font-semibold text-xs overflow-x-auto pb-px">
        {(['All', 'Unpaid', 'Pending', 'Approved', 'Paid'] as const).map(tab => {
          const count = payments.filter(p => {
            const matchesMonth =
              selectedMonth === 'All' ||
              toMonthKey(p.dueDate || '') === selectedMonth ||
              toMonthKey(p.createdAt || '') === selectedMonth ||
              p.reference.toLowerCase().includes(activeMonthDisplay.toLowerCase()) ||
              p.reference.includes(selectedMonth);

            if (!matchesMonth) return false;
            if (tab === 'Unpaid') return p.status === 'Unpaid';
            if (tab === 'Pending') return p.status === 'Pending Approval';
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
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === tab
                  ? 'border-emerald-400 text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab === 'All' ? 'All Payments' : tab === 'Pending' ? 'Pending Approval' : tab}</span>
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
                  onClick={() => handleBulkStatus('Pending Approval')}
                  className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mark Pending</span>
                </button>
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
                  <span>Bulk Execute Payment (Paid)</span>
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
            placeholder="Search payment ID, recipient, ref, event..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Module Type:
          </span>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Module Types</option>
            <option value="Event">Event Payments</option>
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
                <th className="py-3 px-4 font-semibold">Reference / Event Details</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Due Date</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    No payment records found for {activeMonthDisplay} matching the active filters.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  const phone = p.recipientPhone || (p.paymentType === 'Influencer' ? store.getInfluencerPhone(p) : '');

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
                      <td className="py-3.5 px-4 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.paymentType === 'Event'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                            : p.paymentType === 'Influencer'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : p.paymentType === 'Billboard'
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                            : p.paymentType === 'LCD Screen'
                            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {p.paymentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{p.recipient}</div>
                        {phone && phone !== 'N/A' && (
                          <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">{phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold">{p.reference}</div>
                        {p.notes && <div className="text-[11px] text-slate-400 mt-0.5 italic">{p.notes}</div>}
                        {p.paymentMethod && p.status === 'Paid' && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            {p.paymentMethod} {p.paymentReference ? `(${p.paymentReference})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">${p.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{p.dueDate}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : p.status === 'Approved'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : p.status === 'Pending Approval'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {p.status === 'Unpaid' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(p, 'Pending Approval')}
                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-600/40 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                                title="Submit for Approval"
                              >
                                Set Pending
                              </button>
                              {canApprove && (
                                <button
                                  onClick={() => handleUpdateStatus(p, 'Approved')}
                                  className="px-2 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                                >
                                  Approve
                                </button>
                              )}
                            </>
                          )}

                          {p.status === 'Pending Approval' && canApprove && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(p, 'Approved')}
                                className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(p, 'Paid')}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                              >
                                Mark Paid
                              </button>
                            </>
                          )}

                          {p.status === 'Approved' && canApprove && (
                            <button
                              onClick={() => handleUpdateStatus(p, 'Paid')}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                            >
                              Mark Paid
                            </button>
                          )}

                          {canApprove && (
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 cursor-pointer border border-slate-800 bg-slate-900"
                              title="Edit Details / Status"
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

      {/* Record Payment / Event Payment Modal */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsNewPaymentModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Plus className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Record New Payment / Event Disbursement</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Create an Event payment, Influencer retainer, Outdoor media lease, or general marketing disbursement.
            </p>

            <form onSubmit={handleCreateNewPayment} className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Category *</label>
                  <select
                    value={newPayType}
                    onChange={e => setNewPayType(e.target.value as CentralPaymentType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
                  >
                    <option value="Event">Event Payment</option>
                    <option value="Influencer">Influencer Retainer</option>
                    <option value="Billboard">Billboard Rent</option>
                    <option value="LCD Screen">LCD Screen Lease</option>
                    <option value="Other Marketing Expense">Other Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Disbursement Status *</label>
                  <select
                    value={newPayStatus}
                    onChange={e => setNewPayStatus(e.target.value as CentralPaymentStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid (Disbursed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Recipient / Vendor / Event *</label>
                  <input
                    type="text"
                    required
                    value={newPayRecipient}
                    onChange={e => setNewPayRecipient(e.target.value)}
                    placeholder={newPayType === 'Event' ? 'e.g. Grand Expo Booth Services' : 'e.g. Aya Ahmed'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={newPayPhone}
                    onChange={e => setNewPayPhone(e.target.value)}
                    placeholder="+252 61..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reference / Event Name *</label>
                  <input
                    type="text"
                    required
                    value={newPayReference}
                    onChange={e => setNewPayReference(e.target.value)}
                    placeholder={newPayType === 'Event' ? 'e.g. Tech Summit 2026 Booth' : 'e.g. Retainer - September 2026'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Budget Pool</label>
                  <select
                    value={newPayBudgetType}
                    onChange={e => setNewPayBudgetType(e.target.value as 'Local' | 'International')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Local">Local Budget</option>
                    <option value="International">International Budget</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={newPayAmount || ''}
                    onChange={e => setNewPayAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newPayDueDate}
                    onChange={e => setNewPayDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {newPayStatus === 'Paid' && (
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
                  <h4 className="text-[10.5px] uppercase tracking-wider text-emerald-400 font-bold">Disbursement Reference Parameters</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Payment Method</label>
                      <input
                        type="text"
                        value={newPayMethod}
                        onChange={e => setNewPayMethod(e.target.value)}
                        placeholder="e.g. Hormuud EVC Plus / Wire"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Transaction Ref/No.</label>
                      <input
                        type="text"
                        value={newPayRefNo}
                        onChange={e => setNewPayRefNo(e.target.value)}
                        placeholder="e.g. TXN-89211"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Description</label>
                <textarea
                  value={newPayNotes}
                  onChange={e => setNewPayNotes(e.target.value)}
                  placeholder="Additional details regarding agreement or venue contract..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  value={genTargetMonth}
                  onChange={e => setGenTargetMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {['September 2026', 'August 2026', 'July 2026', 'June 2026', 'May 2026', 'April 2026', 'March 2026', 'February 2026', 'January 2026', 'October 2026', 'November 2026', 'December 2026'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Real-time Dynamic Estimation Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Dynamic Generation Preview ({genTargetMonth})</h4>
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
                  <strong>Idempotency Rule Active:</strong> The generation algorithm automatically skips any entities that already have registered payments for <strong>{genTargetMonth}</strong> to avoid double payments.
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPayment(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Edit2 className="w-4 h-4" />
              <h3 className="text-base font-bold text-white">Review & Edit Payment details</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Review agreement obligations, alter payment parameters, or update disbursement status.</p>

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
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold cursor-pointer"
                >
                  <option value="Unpaid">Unpaid</option>
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
