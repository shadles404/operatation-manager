import React, { useState } from 'react';
import {
  X,
  Users,
  Video,
  CheckCircle2,
  Package,
  CreditCard,
  FileText,
  Calendar,
  ExternalLink,
  DollarSign,
  Award
} from 'lucide-react';
import { store } from '../../services/store';
import { Influencer } from '../../types';

interface InfluencerProfileModalProps {
  influencer: Influencer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InfluencerProfileModal: React.FC<InfluencerProfileModalProps> = ({
  influencer,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Tracking' | 'Deliveries' | 'Payments' | 'Agreement'>('Overview');

  if (!isOpen || !influencer) return null;

  const targets = store.getTargets().filter(t => t.influencerId === influencer.id);
  const deliveries = store.getDeliveries().filter(d => d.influencerId === influencer.id);
  const payments = store.getPayments().filter(p => p.recipient.includes(influencer.fullName) || p.relatedEntityId === influencer.id);

  const currentTarget = targets[0] || {
    targetVideos: influencer.targetVideosPerMonth,
    completedVideos: 0,
    remainingVideos: influencer.targetVideosPerMonth,
    achievementPercent: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile Info */}
        <div className="flex items-start gap-4 mb-6 border-b border-slate-800 pb-5">
          <img
            src={influencer.profilePhoto}
            alt={influencer.fullName}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{influencer.fullName}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {influencer.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                influencer.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {influencer.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {influencer.tiktokUsername || influencer.instagramUsername} • {influencer.followers.toLocaleString()} Followers • {influencer.location}
            </p>
          </div>
        </div>

        {/* Highlight KPI Cards (Section 9 Example Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Monthly Target</div>
            <div className="text-lg font-black text-white">{currentTarget.targetVideos} <span className="text-xs font-normal">Videos</span></div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Completed</div>
            <div className="text-lg font-black text-amber-400">{currentTarget.completedVideos}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Remaining</div>
            <div className="text-lg font-black text-slate-300">{currentTarget.remainingVideos}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Achievement</div>
            <div className="text-lg font-black text-emerald-400">{currentTarget.achievementPercent}%</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-4 text-xs font-semibold">
          {(['Overview', 'Tracking', 'Deliveries', 'Payments', 'Agreement'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[220px] text-xs space-y-4">
          {activeTab === 'Overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Monthly Salary</span>
                  <span className="font-bold text-white text-sm">${influencer.salary} / month</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Method</span>
                  <span className="font-semibold text-slate-200">{influencer.paymentMethod} ({influencer.paymentAccount})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Agreement Dates</span>
                  <span className="font-semibold text-slate-200">{influencer.agreementStart} to {influencer.agreementEnd}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Social Profile</span>
                  {influencer.profileUrl ? (
                    <a href={influencer.profileUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1">
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </div>
              </div>

              {influencer.notes && (
                <div className="bg-slate-800/20 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <span className="font-bold text-slate-200 block mb-1">Operational Notes</span>
                  <p>{influencer.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Tracking' && (
            <div>
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2">Month</th>
                    <th className="py-2 text-center">Target</th>
                    <th className="py-2 text-center">Completed</th>
                    <th className="py-2 text-center">Remaining</th>
                    <th className="py-2 text-right">Achievement %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {targets.map(t => (
                    <tr key={t.id}>
                      <td className="py-2.5 font-bold text-white">{t.monthYear}</td>
                      <td className="py-2.5 text-center font-mono">{t.targetVideos}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-amber-400">{t.completedVideos}</td>
                      <td className="py-2.5 text-center font-mono">{t.remainingVideos}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">{t.achievementPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Deliveries' && (
            <div>
              {deliveries.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">No product deliveries recorded yet for this influencer.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2">Delivery ID</th>
                      <th className="py-2">Product</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Value</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deliveries.map(d => (
                      <tr key={d.id}>
                        <td className="py-2.5 font-mono text-amber-400">{d.deliveryId}</td>
                        <td className="py-2.5 font-semibold text-white">{d.product}</td>
                        <td className="py-2.5 text-center font-mono">{d.quantity}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">${d.totalPrice}</td>
                        <td className="py-2.5 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {d.deliveryStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'Payments' && (
            <div>
              {payments.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">No payments logged yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2">Payment ID</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-mono text-amber-400">{p.paymentId}</td>
                        <td className="py-2.5 text-white">{p.reference}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">${p.amount}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Paid' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'Agreement' && (
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Official Agreement Terms</span>
                <span className="font-mono text-slate-400">{influencer.agreementStart} — {influencer.agreementEnd}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Influencer agrees to produce {influencer.targetVideosPerMonth} high-quality promotional videos per month featuring assigned company products.
                Monthly base retainer: ${influencer.salary} USD payable via {influencer.paymentMethod}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
