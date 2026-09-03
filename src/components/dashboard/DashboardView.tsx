import React from 'react';
import {
  Users,
  Package,
  Building2,
  Monitor,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { store } from '../../services/store';
import { NavSelection } from '../common/Sidebar';
import { getCurrentMonthKey, toMonthDisplay } from '../../utils/budgetUtils';

interface DashboardViewProps {
  onNavigate: (nav: NavSelection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const influencers = store.getInfluencers();
  const targets = store.getTargets();
  const deliveries = store.getDeliveries();
  const billboards = store.getBillboards();
  const lcdScreens = store.getLCDScreens();
  const budgets = store.getBudgets();
  const payments = store.getPayments();
  const alerts = store.getAlerts();

  // Influencer KPI calculations
  const activeInfluencers = influencers.filter(i => i.status === 'Active').length;
  const totalTargetVideos = targets.reduce((sum, t) => sum + t.targetVideos, 0);
  const totalCompletedVideos = targets.reduce((sum, t) => sum + t.completedVideos, 0);
  const targetAchievement = totalTargetVideos > 0 ? ((totalCompletedVideos / totalTargetVideos) * 100).toFixed(1) : '0';

  // Delivery KPI calculations
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.deliveryStatus === 'Pending' || d.deliveryStatus === 'Sent').length;
  const paidDeliveries = deliveries.filter(d => d.paymentStatus === 'Paid').length;
  const unpaidDeliveries = deliveries.filter(d => d.paymentStatus === 'Unpaid').length;
  const pendingDeliveryAmount = deliveries
    .filter(d => d.paymentStatus === 'Unpaid' || d.paymentStatus === 'Pending Approval')
    .reduce((sum, d) => sum + d.paymentAmount, 0);

  // Billboard KPI calculations
  const activeBillboards = billboards.filter(b => b.status === 'Active').length;
  const today = new Date();
  const expiringBillboards = billboards.filter(b => {
    if (b.status !== 'Active') return false;
    const end = new Date(b.agreementEnd);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff <= 15;
  }).length;
  const totalBillboardRent = billboards.reduce((sum, b) => sum + b.rentPrice, 0);
  const unpaidBillboardPayments = payments
    .filter(p => p.paymentType === 'Billboard' && p.status !== 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // LCD KPI calculations
  const activeLCDs = lcdScreens.filter(l => l.status === 'Active').length;
  const expiringLCDs = lcdScreens.filter(l => {
    if (l.status !== 'Active') return false;
    const end = new Date(l.agreementEnd);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff <= 15;
  }).length;
  const totalLCDRent = lcdScreens.reduce((sum, l) => sum + l.rentPrice, 0);
  const unpaidLCDPayments = payments
    .filter(p => p.paymentType === 'LCD Screen' && p.status !== 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Real DB Budget KPI calculations (Current Month)
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthDisplay = toMonthDisplay(currentMonthKey);
  const localSummary = store.getBudgetSummary('Local', currentMonthKey);
  const intlSummary = store.getBudgetSummary('International', currentMonthKey);
  const totalAllocated = localSummary.totalBudget + intlSummary.totalBudget;
  const totalSpent = localSummary.spent + intlSummary.spent;
  const totalRemaining = totalAllocated - totalSpent;
  const totalCommitted = 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{currentMonthDisplay} Executive Summary</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketing Operations Control Center</h1>
          <p className="text-slate-400 text-xs mt-1">Real-time status tracking across influencers, outdoor media, central payments, & budget allocations.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate({ section: 'Reports', subSection: 'Monthly Operations' })}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generate Monthly Operations Report</span>
          </button>
        </div>
      </div>

      {/* KPI Section 1: Influencers & Deliveries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Influencer KPIs */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Influencers</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeInfluencers} <span className="text-xs font-normal text-slate-400">Active</span></div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Monthly Target:</span>
              <span className="font-semibold text-white">{totalTargetVideos} vids</span>
            </div>
            <div className="flex justify-between">
              <span>Completed:</span>
              <span className="font-semibold text-emerald-400">{totalCompletedVideos} vids</span>
            </div>
            <div className="flex justify-between">
              <span>Achievement:</span>
              <span className="font-bold text-amber-400">{targetAchievement}%</span>
            </div>
          </div>
        </div>

        {/* Delivery KPIs */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Product Deliveries</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalDeliveries} <span className="text-xs font-normal text-slate-400">Total</span></div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Pending Delivery:</span>
              <span className="font-semibold text-amber-400">{pendingDeliveries}</span>
            </div>
            <div className="flex justify-between">
              <span>Unpaid Deliveries:</span>
              <span className="font-semibold text-rose-400">{unpaidDeliveries} (${pendingDeliveryAmount.toLocaleString()})</span>
            </div>
            <div className="flex justify-between">
              <span>Paid Deliveries:</span>
              <span className="font-semibold text-emerald-400">{paidDeliveries}</span>
            </div>
          </div>
        </div>

        {/* Billboard KPIs */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Billboards</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeBillboards} <span className="text-xs font-normal text-slate-400">Active</span></div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Expiring Soon:</span>
              <span className={`font-semibold ${expiringBillboards > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{expiringBillboards}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Rent:</span>
              <span className="font-semibold text-white">${totalBillboardRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Unpaid Rent:</span>
              <span className="font-semibold text-rose-400">${unpaidBillboardPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* LCD KPIs */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">LCD Screens</span>
            <Monitor className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeLCDs} <span className="text-xs font-normal text-slate-400">Active</span></div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Expiring Soon:</span>
              <span className={`font-semibold ${expiringLCDs > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{expiringLCDs}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Rent:</span>
              <span className="font-semibold text-white">${totalLCDRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Unpaid Rent:</span>
              <span className="font-semibold text-rose-400">${unpaidLCDPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Budget KPIs */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Budget Pool</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${totalRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">Remain</span></div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Allocated:</span>
              <span className="font-semibold text-white">${totalAllocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Spent:</span>
              <span className="font-semibold text-rose-300">${totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Committed:</span>
              <span className="font-semibold text-amber-300">${totalCommitted.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Required Panel (Requirement #6) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">Attention Required</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold">
              {alerts.length} Items
            </span>
          </div>
          <button
            onClick={() => onNavigate({ section: 'Reports', subSection: 'Monthly Operations' })}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>View Full Operations Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map(alt => (
            <div
              key={alt.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                alt.type === 'danger'
                  ? 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                  : 'bg-amber-950/20 border-amber-800/50 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold opacity-80">{alt.module}</span>
                <span className="text-[10px] opacity-60">{alt.date}</span>
              </div>
              <div className="font-bold text-sm text-white">{alt.title}</div>
              <p className="opacity-90 leading-relaxed text-[11px]">{alt.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Visual Overview Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Influencers Progress Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Influencer Performance Summary</span>
            </h3>
            <button
              onClick={() => onNavigate({ section: 'Influencers', subSection: 'Target Tracking' })}
              className="text-xs text-slate-400 hover:text-white"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Influencer</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Target</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Done</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Achievement</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {targets.slice(0, 4).map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{t.influencerName}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{t.targetVideos}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{t.completedVideos}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              t.achievementPercent >= 100
                                ? 'bg-emerald-400'
                                : t.achievementPercent >= 80
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, t.achievementPercent)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">{t.achievementPercent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'Exceeded' || t.status === 'Target Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Central Payments Status Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Pending Central Payments</span>
            </h3>
            <button
              onClick={() => onNavigate({ section: 'Payments', subSection: 'Pending' })}
              className="text-xs text-slate-400 hover:text-white"
            >
              View All Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Ref</th>
                  <th className="py-2.5 px-3 font-semibold">Recipient</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.slice(0, 4).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">{p.paymentId}</td>
                    <td className="py-2.5 px-3 text-white truncate max-w-[140px]">{p.recipient}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">${p.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : p.status === 'Approved'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
