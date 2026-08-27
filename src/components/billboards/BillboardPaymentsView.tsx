import React, { useState } from 'react';
import { CreditCard, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { store } from '../../services/store';
import { CentralPayment } from '../../types';

export const BillboardPaymentsView: React.FC = () => {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const payments = store.getPayments().filter(p => p.paymentType === 'Billboard');
  const canApprove = store.hasPermission('billboard_payments', 'approve');

  const handleUpdateStatus = (payment: CentralPayment, nextStatus: CentralPayment['status']) => {
    if ((nextStatus === 'Approved' || nextStatus === 'Paid') && !canApprove) {
      setPermissionError('Permission denied: Approval required for billboard rent payments');
      return;
    }
    const res = store.updatePaymentStatus(payment.id, nextStatus);
    if (!res.success) setPermissionError(res.error || 'Failed to update payment');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-400" />
            <span>Billboard Rent & Printing Payments</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Track outdoor media rent, vinyl printing, & installation payments</p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Recipient / Provider</th>
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
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">{pay.paymentId}</td>
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
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {canApprove && pay.status === 'Approved' && (
                      <button
                        onClick={() => handleUpdateStatus(pay, 'Paid')}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
                      >
                        Mark Paid
                      </button>
                    )}
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
