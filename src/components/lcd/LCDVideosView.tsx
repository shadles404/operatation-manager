import React, { useState } from 'react';
import { Video, Plus, Search, ShieldAlert } from 'lucide-react';
import { store } from '../../services/store';
import { LCDVideo, LCDVideoStatus } from '../../types';

export const LCDVideosView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Form Fields
  const [screenId, setScreenId] = useState('lcd-1');
  const [videoName, setVideoName] = useState('');
  const [product, setProduct] = useState('');
  const [campaign, setCampaign] = useState('Summer Sale 2026');
  const [duration, setDuration] = useState('15 sec');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [status, setStatus] = useState<LCDVideoStatus>('Showing');

  const lcdVideos = store.getLCDVideos();
  const lcdScreens = store.getLCDScreens();

  const canAdd = store.hasPermission('lcd_videos', 'add');
  const canUpdate = store.hasPermission('lcd_videos', 'update');

  const filtered = lcdVideos.filter(v =>
    v.videoName.toLowerCase().includes(search.toLowerCase()) ||
    v.screenName.toLowerCase().includes(search.toLowerCase()) ||
    v.product.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setPermissionError('Permission denied: Cannot add video asset to playlist');
      return;
    }

    const screenObj = lcdScreens.find(s => s.id === screenId);

    const res = store.addLCDVideo({
      screenId,
      screenName: screenObj ? screenObj.screenName : 'Selected Screen',
      videoName,
      product,
      campaign,
      duration,
      resolution: screenObj ? screenObj.resolution : '1080p',
      submittedDate: '2026-08-27',
      startDate,
      endDate,
      status
    });

    if (res.success) {
      setIsModalOpen(false);
      setVideoName('');
      setProduct('');
    } else {
      setPermissionError(res.error || 'Failed to add video asset');
    }
  };

  const handleUpdateStatus = (video: LCDVideo, nextStatus: LCDVideoStatus) => {
    if (!canUpdate) {
      setPermissionError('Permission denied: Cannot update video broadcast status');
      return;
    }
    const res = store.updateLCDVideo(video.id, { status: nextStatus });
    if (!res.success) setPermissionError(res.error || 'Failed to update video status');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            <span>LCD Video Broadcast & Playlist Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Track video commercials playing across LCD screen venue displays</p>
        </div>

        {canAdd && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Video Asset</span>
          </button>
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

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search video title, product, screen..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Video ID</th>
                <th className="py-3 px-4 font-semibold">Target Screen</th>
                <th className="py-3 px-4 font-semibold">Commercial Title & Product</th>
                <th className="py-3 px-4 font-semibold text-center">Duration</th>
                <th className="py-3 px-4 font-semibold text-center">Schedule</th>
                <th className="py-3 px-4 font-semibold text-center">Broadcast Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(vid => (
                <tr key={vid.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{vid.videoId}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{vid.screenName}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{vid.videoName}</div>
                    <div className="text-[10px] text-amber-300">{vid.product} ({vid.campaign})</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">{vid.duration}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {vid.startDate} to {vid.endDate}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      vid.status === 'Showing'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : vid.status === 'Approved'
                        ? 'bg-sky-950 text-sky-300 border border-sky-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {vid.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {canUpdate && vid.status !== 'Showing' && (
                      <button
                        onClick={() => handleUpdateStatus(vid, 'Showing')}
                        className="px-2 py-1 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded"
                      >
                        Start Showing
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Submit LCD Video Asset</h3>
            <p className="text-xs text-slate-400 mb-4">Assign video commercial to target venue screen playlist</p>

            <form onSubmit={handleAddVideo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target LCD Display *</label>
                <select
                  value={screenId}
                  onChange={e => setScreenId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  {lcdScreens.map(s => (
                    <option key={s.id} value={s.id}>{s.screenId} - {s.screenName} ({s.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Video Title *</label>
                  <input
                    type="text"
                    required
                    value={videoName}
                    onChange={e => setVideoName(e.target.value)}
                    placeholder="HydraGlow Lip Gloss Ad"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    placeholder="HydraGlow Lip Gloss"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as LCDVideoStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Showing">Showing</option>
                    <option value="Approved">Approved</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl"
                >
                  Submit Video Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
