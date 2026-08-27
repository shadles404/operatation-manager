import React, { useState } from 'react';
import { Monitor, Plus, Search, Calendar, ShieldAlert, Edit2, Download, CheckSquare, Square, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { store } from '../../services/store';
import { LCDScreen, LCDStatus } from '../../types';
import * as XLSX from 'xlsx';

export const LCDScreensView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLCD, setEditingLCD] = useState<LCDScreen | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Form Fields
  const [screenId, setScreenId] = useState('LCD-005');
  const [screenName, setScreenName] = useState('');
  const [location, setLocation] = useState('');
  const [exactAddress, setExactAddress] = useState('Km4 Intersection, Mogadishu');
  const [screenSize, setScreenSize] = useState('85 inch');
  const [resolution, setResolution] = useState('4K UHD');
  const [rentPrice, setRentPrice] = useState(800);
  const [agreementStart, setAgreementStart] = useState('2026-08-01');
  const [agreementEnd, setAgreementEnd] = useState('2026-09-30');
  const [status, setStatus] = useState<LCDStatus>('Active');

  const lcdScreens = store.getLCDScreens();
  const lcdVideos = store.getLCDVideos();
  const today = new Date('2026-08-27');

  const canAdd = store.hasPermission('lcd_screens', 'add');
  const canUpdate = store.hasPermission('lcd_screens', 'update');
  const canDelete = store.hasPermission('lcd_screens', 'delete');
  const canExport = store.hasPermission('lcd_screens', 'export');

  const filtered = lcdScreens.filter(l =>
    l.screenId.toLowerCase().includes(search.toLowerCase()) ||
    l.screenName.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filtered.length > 0 && filtered.every(l => selectedIds.includes(l.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(l => l.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteOne = (id: string, screenIdStr: string) => {
    if (!canDelete) {
      setPermissionError('Permission denied: Cannot delete LCD screen');
      return;
    }
    if (confirm(`Are you sure you want to delete screen ${screenIdStr}?`)) {
      const res = store.deleteLCDScreen(id);
      if (!res.success) {
        setPermissionError(res.error || 'Failed to delete LCD screen');
      } else {
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return;
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected LCD screen(s)?`)) {
      const res = await store.bulkDeleteLCDScreens(selectedIds);
      if (res.success) {
        setSelectedIds([]);
      } else {
        setPermissionError(res.error || 'Failed to bulk delete LCD screens');
      }
    }
  };

  const handleBulkStatus = async (status: LCDStatus) => {
    if (!canUpdate) return;
    if (selectedIds.length === 0) return;
    const res = await store.bulkUpdateLCDScreenStatus(selectedIds, status);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to bulk update status');
    }
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLCD) {
      if (!canUpdate) {
        setPermissionError('Permission denied: Cannot update LCD screen');
        return;
      }
      const res = store.updateLCDScreen(editingLCD.id, {
        screenId,
        screenName,
        location,
        exactAddress,
        screenSize,
        resolution,
        rentPrice,
        agreementStart,
        agreementEnd,
        status
      });
      if (res.success) {
        setIsModalOpen(false);
        setEditingLCD(null);
      } else setPermissionError(res.error || 'Failed to update LCD screen');
    } else {
      if (!canAdd) {
        setPermissionError('Permission denied: Cannot add LCD screen');
        return;
      }
      const res = store.addLCDScreen({
        screenId,
        screenName,
        location,
        exactAddress,
        screenSize,
        resolution,
        screenType: 'Indoor Digital Mall Wall',
        ownerProvider: 'Digital Vision Somalia',
        contact: '+252 61 900 8877',
        rentPrice,
        currency: 'USD',
        paymentFrequency: 'Monthly',
        agreementStart,
        agreementEnd,
        status
      });
      if (res.success) setIsModalOpen(false);
      else setPermissionError(res.error || 'Failed to add LCD screen');
    }
  };

  const handleExport = () => {
    if (!canExport) {
      setPermissionError('Permission denied: Cannot export LCD screens');
      return;
    }
    const data = filtered.map(l => ({
      ScreenID: l.screenId,
      Name: l.screenName,
      Location: l.location,
      Address: l.exactAddress,
      Size: l.screenSize,
      RentMonthly: l.rentPrice,
      AgreementEnd: l.agreementEnd,
      Status: l.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LCD_Screens");
    XLSX.writeFile(wb, `LCD_Screens_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-400" />
            <span>LCD Screens Roster & Location Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage indoor mall displays, supermarket screens, and digital wall leases</p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={() => {
                setEditingLCD(null);
                setScreenId(`LCD-${Math.floor(100 + Math.random() * 900)}`);
                setScreenName('');
                setLocation('');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register LCD Screen</span>
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

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-purple-950/40 border border-purple-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span>{selectedIds.length} screen(s) selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <>
                <button
                  onClick={() => handleBulkStatus('Active')}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Set Active</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('Maintenance')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Set Maintenance</span>
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Bulk Delete ({selectedIds.length})</span>
              </button>
            )}
          </div>
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
              placeholder="Search screen ID, venue name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-10">
                  <button 
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Screen ID</th>
                <th className="py-3 px-4 font-semibold">Display Name & Venue</th>
                <th className="py-3 px-4 font-semibold text-center">Size</th>
                <th className="py-3 px-4 font-semibold text-center">Active Playlist</th>
                <th className="py-3 px-4 font-semibold text-right">Rent / Month</th>
                <th className="py-3 px-4 font-semibold text-center">Days Remaining</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(lcd => {
                const endDate = new Date(lcd.agreementEnd);
                const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                const activeVideosCount = lcdVideos.filter(v => v.screenId === lcd.id && (v.status === 'Showing' || v.status === 'Approved')).length;
                const isSelected = selectedIds.includes(lcd.id);

                return (
                  <tr key={lcd.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-purple-500/5' : ''}`}>
                    <td className="py-3.5 px-4">
                      <button 
                        onClick={() => handleSelectOne(lcd.id)}
                        className="text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{lcd.screenId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{lcd.screenName}</div>
                      <div className="text-[11px] text-slate-400">{lcd.location} ({lcd.exactAddress})</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">{lcd.screenSize}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-amber-400 font-mono">{activeVideosCount} Videos</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${lcd.rentPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        diffDays <= 10
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {diffDays > 0 ? `Expires in ${diffDays} days` : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        {lcd.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1">
                      {canUpdate && (
                        <button
                          onClick={() => {
                            setEditingLCD(lcd);
                            setScreenId(lcd.screenId);
                            setScreenName(lcd.screenName);
                            setLocation(lcd.location);
                            setRentPrice(lcd.rentPrice);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 cursor-pointer"
                          title="Edit LCD Screen"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteOne(lcd.id, lcd.screenId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Delete LCD Screen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit LCD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {editingLCD ? `Edit LCD Screen: ${editingLCD.screenId}` : 'Register New LCD Display'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Indoor digital display details & venue agreement terms</p>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Screen ID *</label>
                  <input
                    type="text"
                    required
                    value={screenId}
                    onChange={e => setScreenId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={screenName}
                    onChange={e => setScreenName(e.target.value)}
                    placeholder="Main Entrance Video Wall"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Venue / City Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Mogadishu City Center"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Exact Address</label>
                  <input
                    type="text"
                    value={exactAddress}
                    onChange={e => setExactAddress(e.target.value)}
                    placeholder="Ground Floor Atrium"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Screen Size</label>
                  <input
                    type="text"
                    value={screenSize}
                    onChange={e => setScreenSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Resolution</label>
                  <input
                    type="text"
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rent / Mo ($)</label>
                  <input
                    type="number"
                    value={rentPrice}
                    onChange={e => setRentPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreement Start</label>
                  <input
                    type="date"
                    value={agreementStart}
                    onChange={e => setAgreementStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreement End</label>
                  <input
                    type="date"
                    value={agreementEnd}
                    onChange={e => setAgreementEnd(e.target.value)}
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
                  Save Screen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
