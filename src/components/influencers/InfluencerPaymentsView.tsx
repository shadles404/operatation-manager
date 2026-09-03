import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  ChevronDown,
  DollarSign,
  Calendar,
  UserCheck,
  Phone
} from 'lucide-react';
import { store } from '../../services/store';
import { CentralPayment, CentralPaymentStatus } from '../../types';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const InfluencerPaymentsView: React.FC = () => {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CentralPaymentStatus>('All');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const payments = store.getPayments().filter(p => p.paymentType === 'Influencer');
  const canApprove = store.hasPermission('influencer_payments', 'approve') || store.getCurrentUser()?.role === 'admin';
  const canExport = store.hasPermission('influencer_payments', 'export') || store.getCurrentUser()?.role === 'admin';

  // Filter payments
  const filtered = payments.filter(p => {
    const matchesSearch =
      p.paymentId.toLowerCase().includes(search.toLowerCase()) ||
      p.recipient.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter(p => p.status === 'Pending Approval' || p.status === 'Approved')
    .reduce((sum, p) => sum + p.amount, 0);
  const unpaidAmount = payments.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + p.amount, 0);

  const handleUpdateStatus = (payment: CentralPayment, nextStatus: CentralPayment['status']) => {
    if ((nextStatus === 'Approved' || nextStatus === 'Paid') && !canApprove) {
      setPermissionError('Permission denied: You do not have Approval authority for payments');
      return;
    }
    const res = store.updatePaymentStatus(payment.id, nextStatus);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to update payment status');
    }
  };

  const getExportData = () => {
    return filtered.map(pay => {
      const phone = store.getInfluencerPhone(pay);
      return {
        'Payment ID': pay.paymentId,
        'Recipient (Influencer)': pay.recipient,
        'Influencer Phone Number': phone,
        'Payment Type': pay.paymentType,
        'Reference / Period': pay.reference,
        'Amount (USD)': pay.amount,
        'Due Date': pay.dueDate,
        'Status': pay.status,
        'Payment Date': pay.paymentDate || 'N/A',
        'Payment Method': pay.paymentMethod || 'N/A',
        'Transaction Ref': pay.paymentReference || 'N/A',
        'Notes': pay.notes || '',
        'Created Date': pay.createdAt || 'N/A'
      };
    });
  };

  const handleExportExcel = () => {
    if (!canExport) {
      setPermissionError('Permission denied: You do not have permission to export Influencer Payments data');
      return;
    }
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Influencer Payments');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Influencer_Payments_${dateStr}.xlsx`);
    setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    if (!canExport) {
      setPermissionError('Permission denied: You do not have permission to export Influencer Payments data');
      return;
    }
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Influencer Payments');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Influencer_Payments_${dateStr}.csv`, { bookType: 'csv' });
    setIsExportMenuOpen(false);
  };

  const handleGeneratePDFInvoice = (pay: CentralPayment) => {
    const doc = new jsPDF();
    const phone = store.getInfluencerPhone(pay);

    doc.setFontSize(20);
    doc.setTextColor(234, 179, 8); // amber
    doc.text('INFLUENCER PAYMENT INVOICE', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Marketing Operations Management System', 14, 28);
    doc.text(`Invoice Ref: ${pay.paymentId}`, 14, 34);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    doc.line(14, 45, 196, 45);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Recipient: ${pay.recipient}`, 14, 55);
    if (phone && phone !== 'N/A') {
      doc.text(`Phone: ${phone}`, 14, 63);
      doc.text(`Payment Details: ${pay.notes || pay.reference}`, 14, 71);
      doc.text(`Due Date: ${pay.dueDate}`, 14, 79);
      doc.text(`Current Payment Status: ${pay.status}`, 14, 87);

      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(`Total Amount: $${pay.amount.toFixed(2)} USD`, 14, 103);
    } else {
      doc.text(`Payment Details: ${pay.notes || pay.reference}`, 14, 63);
      doc.text(`Due Date: ${pay.dueDate}`, 14, 71);
      doc.text(`Current Payment Status: ${pay.status}`, 14, 79);

      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(`Total Amount: $${pay.amount.toFixed(2)} USD`, 14, 95);
    }

    doc.save(`Invoice_${pay.paymentId}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <span>Influencer Payments & Retainers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Workflow status pipeline: Unpaid → Pending Approval → Approved → Paid</p>
        </div>

        {/* Export Buttons */}
        {canExport && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Export filtered records to Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Export filtered records to CSV file (.csv)"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Retainers</div>
          <div className="text-xl font-black text-white mt-1">
            ${totalAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">({payments.length} payments)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Disbursed (Paid)</div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            ${paidAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">
              ({payments.filter(p => p.status === 'Paid').length})
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Approval / Approved</div>
          <div className="text-xl font-black text-sky-400 mt-1">
            ${pendingAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">
              ({payments.filter(p => p.status === 'Pending Approval' || p.status === 'Approved').length})
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unpaid Pipeline</div>
          <div className="text-xl font-black text-amber-400 mt-1">
            ${unpaidAmount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">
              ({payments.filter(p => p.status === 'Unpaid').length})
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipient, ref, or payment ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Status:
          </span>
          {(['All', 'Unpaid', 'Pending Approval', 'Approved', 'Paid'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div>
            Showing <span className="text-white font-bold">{filtered.length}</span> of{' '}
            <span className="text-white font-bold">{payments.length}</span> payment records
          </div>
          {canExport && filtered.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Quick Export:</span>
              <button
                onClick={handleExportExcel}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-[11px] cursor-pointer"
              >
                Excel (.xlsx)
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={handleExportCSV}
                className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px] cursor-pointer"
              >
                CSV (.csv)
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Recipient</th>
                <th className="py-3 px-4 font-semibold">Reference / Period</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Due Date</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No influencer payments match the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{pay.paymentId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{pay.recipient}</div>
                      {(() => {
                        const phone = store.getInfluencerPhone(pay);
                        if (!phone || phone === 'N/A') return null;
                        return (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{phone}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{pay.reference}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${pay.amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{pay.dueDate}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pay.status === 'Paid'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : pay.status === 'Approved'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : pay.status === 'Pending Approval'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGeneratePDFInvoice(pay)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Download Invoice PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Invoice</span>
                        </button>

                        {canApprove && pay.status === 'Unpaid' && (
                          <button
                            onClick={() => handleUpdateStatus(pay, 'Pending Approval')}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 cursor-pointer"
                          >
                            Submit
                          </button>
                        )}

                        {canApprove && pay.status === 'Pending Approval' && (
                          <button
                            onClick={() => handleUpdateStatus(pay, 'Approved')}
                            className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {canApprove && pay.status === 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(pay, 'Paid')}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
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
