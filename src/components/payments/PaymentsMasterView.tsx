import React, { useState } from 'react';
import { CreditCard, Search, ShieldAlert, CheckCircle2, Clock, Filter, FileText } from 'lucide-react';
import { store } from '../../services/store';
import { CentralPayment, CentralPaymentStatus } from '../../types';

interface PaymentsMasterViewProps {
  initialFilter?: 'All' | 'Pending' | 'Approved' | 'Paid';
}

export const PaymentsMasterView: React.FC<PaymentsMasterViewProps> = ({ initialFilter = 'All' }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Paid'>(initialFilter);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [permissionError, setPermissionError] = useState<string | null>(null);

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
              onClick={() => setActiveTab(tab)}
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
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
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
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.paymentId}</td>
                  <td className="py-3.5 px-4 font-semibold text-amber-300">{p.paymentType}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{p.recipient}</td>
                  <td className="py-3.5 px-4 text-slate-300">{p.reference}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">${p.amount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400">{p.dueDate}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === 'Unpaid' && (
                        <button
                          onClick={() => handleUpdateStatus(p, 'Pending Approval')}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 transition-colors"
                        >
                          Submit Approval
                        </button>
                      )}

                      {p.status === 'Pending Approval' && (
                        <button
                          onClick={() => handleUpdateStatus(p, 'Approved')}
                          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors"
                        >
                          Approve Payment
                        </button>
                      )}

                      {p.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(p, 'Paid')}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors"
                        >
                          Execute Payment
                        </button>
                      )}

                      {p.status === 'Paid' && (
                        <span className="text-[10px] text-slate-500 font-mono italic">Disbursed</span>
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
