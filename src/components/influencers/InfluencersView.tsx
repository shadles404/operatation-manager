import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { store } from '../../services/store';
import { Influencer, InfluencerCategory, InfluencerStatus } from '../../types';
import { InfluencerFormModal } from './InfluencerFormModal';
import { InfluencerProfileModal } from './InfluencerProfileModal';
import * as XLSX from 'xlsx';

export const InfluencersView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [profileInfluencer, setProfileInfluencer] = useState<Influencer | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const influencers = store.getInfluencers();
  const targets = store.getTargets();

  const canAdd = store.hasPermission('influencers', 'add');
  const canUpdate = store.hasPermission('influencers', 'update');
  const canDelete = store.hasPermission('influencers', 'delete');
  const canExport = store.hasPermission('influencers', 'export');

  // Filtering
  const filtered = influencers.filter(inf => {
    const matchesSearch =
      inf.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (inf.tiktokUsername && inf.tiktokUsername.toLowerCase().includes(search.toLowerCase())) ||
      (inf.instagramUsername && inf.instagramUsername.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || inf.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || inf.status === selectedStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    if (!canExport) {
      setPermissionError('Permission denied: You do not have permission to export Influencers data');
      return;
    }
    const exportData = filtered.map(i => ({
      ID: i.id,
      FullName: i.fullName,
      Category: i.category,
      TikTok: i.tiktokUsername,
      TargetVideos: i.targetVideosPerMonth,
      SalaryUSD: i.salary,
      AgreementStart: i.agreementStart,
      AgreementEnd: i.agreementEnd,
      Status: i.status
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Influencers");
    XLSX.writeFile(wb, `Influencers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = (id: string, name: string) => {
    if (!canDelete) {
      setPermissionError(`Permission denied: Cannot delete influencer ${name}`);
      return;
    }
    if (confirm(`Are you sure you want to delete ${name}? This action is irreversible.`)) {
      store.deleteInfluencer(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Influencers Roster</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage creators, video targets, monthly retainers, and agreement validity</p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV/Excel</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={() => {
                setEditingInfluencer(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Influencer</span>
            </button>
          )}
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

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, @handle..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Beauty">Beauty</option>
            <option value="Cosmetics">Cosmetics</option>
            <option value="Fashion">Fashion</option>
            <option value="Tech">Tech</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Fitness">Fitness</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Influencer</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-center">Target</th>
                <th className="py-3 px-4 font-semibold text-center">Progress</th>
                <th className="py-3 px-4 font-semibold text-right">Salary</th>
                <th className="py-3 px-4 font-semibold text-center">Agreement</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No influencers found matching search criteria.
                  </td>
                </tr>
              ) : (
                paginated.map(inf => {
                  const targetRec = targets.find(t => t.influencerId === inf.id) || {
                    completedVideos: 0,
                    targetVideos: inf.targetVideosPerMonth,
                    achievementPercent: 0
                  };
                  return (
                    <tr key={inf.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={inf.profilePhoto}
                            alt={inf.fullName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{inf.fullName}</div>
                            <div className="text-[11px] text-slate-400">{inf.tiktokUsername || inf.instagramUsername}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">{inf.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{inf.targetVideosPerMonth} vids</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center">
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full ${
                                targetRec.achievementPercent >= 100
                                  ? 'bg-emerald-400'
                                  : targetRec.achievementPercent >= 80
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, targetRec.achievementPercent)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {targetRec.completedVideos} / {targetRec.targetVideos} ({targetRec.achievementPercent}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">${inf.salary}</td>
                      <td className="py-3 px-4 text-center text-[11px] font-mono text-slate-400">
                        {inf.agreementStart} to {inf.agreementEnd}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inf.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {inf.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setProfileInfluencer(inf);
                              setIsProfileOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => {
                                setEditingInfluencer(inf);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                              title="Edit Influencer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(inf.id, inf.fullName)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete Influencer"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-semibold">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="text-white font-semibold">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
            <span className="text-white font-semibold">{filtered.length}</span> influencers
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white font-semibold">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Register/Edit Modal */}
      <InfluencerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {}}
        editInfluencer={editingInfluencer}
      />

      {/* Profile Modal */}
      <InfluencerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        influencer={profileInfluencer}
      />
    </div>
  );
};
