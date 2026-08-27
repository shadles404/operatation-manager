import React, { useState } from 'react';
import { CreditCard, FileText, CheckCircle2, Clock, ShieldAlert, ArrowRight, Printer } from 'lucide-react';
import { store } from '../../services/store';
import { CentralPayment } from '../../types';
import jsPDF from 'jspdf';

export const InfluencerPaymentsView: React.FC = () => {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [selectedInvoicePayment, setSelectedInvoicePayment] = useState<CentralPayment | null>(null);

  const payments = store.getPayments().filter(p => p.paymentType === 'Influencer');
  const canApprove = store.hasPermission('influencer_payments', 'approve');

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

  const handleGeneratePDFInvoice = (pay: CentralPayment) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(234, 179, 8); // amber
    doc.text("INFLUENCER PAYMENT INVOICE", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Marketing Operations Management System", 14, 28);
    doc.text(`Invoice Ref: ${pay.paymentId}`, 14, 34);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    doc.line(14, 45, 196, 45);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Recipient: ${pay.recipient}`, 14, 55);
    doc.text(`Payment Details: ${pay.notes || pay.reference}`, 14, 63);
    doc.text(`Due Date: ${pay.dueDate}`, 14, 71);
    doc.text(`Current Payment Status: ${pay.status}`, 14, 79);

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`Total Amount: $${pay.amount.toFixed(2)} USD`, 14, 95);

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

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Recipient</th>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Due Date</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payments.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{pay.paymentId}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{pay.recipient}</td>
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
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                        title="Download Invoice PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Invoice</span>
                      </button>

                      {canApprove && pay.status === 'Unpaid' && (
                        <button
                          onClick={() => handleUpdateStatus(pay, 'Pending Approval')}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40"
                        >
                          Submit
                        </button>
                      )}

                      {canApprove && pay.status === 'Pending Approval' && (
                        <button
                          onClick={() => handleUpdateStatus(pay, 'Approved')}
                          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg"
                        >
                          Approve
                        </button>
                      )}

                      {canApprove && pay.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(pay, 'Paid')}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
