import React, { useState } from 'react';
import { X, UserPlus, ShieldAlert } from 'lucide-react';
import { store } from '../../services/store';
import { Influencer, InfluencerCategory, InfluencerStatus } from '../../types';

interface InfluencerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editInfluencer?: Influencer | null;
}

const CATEGORIES: InfluencerCategory[] = [
  'Beauty',
  'Food',
  'Cosmetics',
  'Fashion',
  'Tech',
  'Lifestyle',
  'Fitness',
  'Other'
];

export const InfluencerFormModal: React.FC<InfluencerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editInfluencer
}) => {
  if (!isOpen) return null;

  const isEdit = !!editInfluencer;

  const [fullName, setFullName] = useState(editInfluencer?.fullName || '');
  const [tiktokUsername, setTiktokUsername] = useState(editInfluencer?.tiktokUsername || '');
  const [phone, setPhone] = useState(editInfluencer?.phone || '');
  const [category, setCategory] = useState<InfluencerCategory>(editInfluencer?.category || 'Beauty');
  const [targetVideosPerMonth, setTargetVideosPerMonth] = useState<number>(editInfluencer ? editInfluencer.targetVideosPerMonth : 0);
  const [salary, setSalary] = useState<number>(editInfluencer ? editInfluencer.salary : 0);
  const [agreementStart, setAgreementStart] = useState(editInfluencer?.agreementStart || '');
  const [agreementEnd, setAgreementEnd] = useState(editInfluencer?.agreementEnd || '');
  const [status, setStatus] = useState<InfluencerStatus>(editInfluencer?.status || 'Active');
  const [notes, setNotes] = useState(editInfluencer?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full Name is required');
      return;
    }

    const payload = {
      fullName,
      tiktokUsername,
      instagramUsername: editInfluencer?.instagramUsername || '',
      phone,
      location: editInfluencer?.location || 'Mogadishu',
      category,
      followers: editInfluencer?.followers || 0,
      profileUrl: editInfluencer?.profileUrl || '',
      targetVideosPerMonth: Number(targetVideosPerMonth),
      salary: Number(salary),
      paymentMethod: editInfluencer?.paymentMethod || 'EVC Plus',
      paymentAccount: editInfluencer?.paymentAccount || '',
      agreementStart,
      agreementEnd,
      status,
      notes,
      profilePhoto: editInfluencer?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
    };

    if (isEdit && editInfluencer) {
      const res = await store.updateInfluencer(editInfluencer.id, payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to update influencer');
      }
    } else {
      const res = await store.addInfluencer(payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to register influencer');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-400" />
          <span>{isEdit ? 'Update Influencer' : 'Register Influencer'}</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">Enter agreement terms and creator profile details</p>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">TikTok Username</label>
            <input
              type="text"
              value={tiktokUsername}
              onChange={e => setTiktokUsername(e.target.value)}
              placeholder="@username"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Category / Niche</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as InfluencerCategory)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Videos/Month</label>
              <input
                type="number"
                min="0"
                value={targetVideosPerMonth}
                onChange={e => setTargetVideosPerMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Salary</label>
              <input
                type="number"
                min="0"
                value={salary}
                onChange={e => setSalary(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Agreement Start</label>
              <input
                type="date"
                value={agreementStart}
                onChange={e => setAgreementStart(e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Agreement End</label>
              <input
                type="date"
                value={agreementEnd}
                onChange={e => setAgreementEnd(e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as InfluencerStatus)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-colors cursor-pointer"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
