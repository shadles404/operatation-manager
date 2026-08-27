import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldAlert,
  Trash2,
  Edit2
} from 'lucide-react';
import { store } from '../../services/store';
import { Billboard, BillboardStatus, BillboardOpStatus } from '../../types';
import * as XLSX from 'xlsx';

export const BillboardsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillboard, setEditingBillboard] = useState<Billboard | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Form Fields
  const [billboardId, setBillboardId] = useState('BB-025');
  const [location, setLocation] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [districtArea, setDistrictArea] = useState('Hodan');
  const [size, setSize] = useState('12m x 4m');
  const [billboardType, setBillboardType] = useState('Unipole Static');
  const [ownerProvider, setOwnerProvider] = useState('');
  const [contact, setContact] = useState('');
  const [rentPrice, setRentPrice] = useState(1500);
  const [installationCost, setInstallationCost] = useState(300);
  const [printingCost, setPrintingCost] = useState(400);
  const [agreementStart, setAgreementStart] = useState('2026-08-01');
  const [agreementEnd, setAgreementEnd] = useState('2026-09-30');
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentCampaign, setCurrentCampaign] = useState('');
  const [status, setStatus] = useState<BillboardStatus>('Active');
  const [opStatus, setOpStatus] = useState<BillboardOpStatus>('Active');
  const [notes, setNotes] = useState('');

  const billboards = store.getBillboards();

  const canAdd = store.hasPermission('billboards', 'add');
  const canUpdate = store.hasPermission('billboards', 'update');
  const canDelete = store.hasPermission('billboards', 'delete');
  const canExport = store.hasPermission('billboards', 'export');

  const today = new Date('2026-08-27');

  const filtered = billboards.filter(b => {
    const matchesSearch =
      b.billboardId.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase()) ||
      (b.currentProduct && b.currentProduct.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBillboard) {
      if (!canUpdate) {
        setPermissionError('Permission denied: Cannot update billboard');
        return;
      }
      const res = store.updateBillboard(editingBillboard.id, {
        billboardId,
        location,
        exactAddress,
        districtArea,
        size,
        billboardType,
        ownerProvider,
        contact,
        rentPrice,
        installationCost,
        printingCost,
        agreementStart,
        agreementEnd,
        currentProduct,
        currentCampaign,
        status,
        opStatus,
        notes
      });
      if (res.success) {
        setIsModalOpen(false);
        setEditingBillboard(null);
      } else {
        setPermissionError(res.error || 'Failed to update billboard');
      }
    } else {
      if (!canAdd) {
        setPermissionError('Permission denied: Cannot add new billboard');
        return;
      }
      const res = store.addBillboard({
        billboardId,
        location,
        exactAddress,
        districtArea,
        size,
        billboardType,
        ownerProvider,
        contact,
        rentPrice,
        currency: 'USD',
        paymentFrequency: 'Monthly',
        installationCost,
        printingCost,
        agreementStart,
        agreementEnd,
        currentProduct,
        currentCampaign,
        status,
        opStatus,
        notes
      });
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setPermissionError(res.error || 'Failed to add billboard');
      }
    }
  };

  const handleExport = () => {
    if (!canExport) {
      setPermissionError('Permission denied: Cannot export billboards');
      return;
    }
    const data = filtered.map(b => ({
      BillboardID: b.billboardId,
      Location: b.location,
      Size: b.size,
      Type: b.billboardType,
      Owner: b.ownerProvider,
      RentMonthly: b.rentPrice,
      AgreementEnd: b.agreementEnd,
      Product: b.currentProduct,
      Status: b.status,
      OpStatus: b.opStatus
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Billboards");
    XLSX.writeFile(wb, `Billboards_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>Billboard Outdoor Media</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Operational pipeline: Artwork → Approved → Printed → Installed → Active → Expired</p>
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
                setEditingBillboard(null);
                setBillboardId(`BB-${Math.floor(100 + Math.random()*900)}`);
                setLocation('');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Billboard</span>
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

      {/* Billboards Cards / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search billboard ID, location, campaign..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Billboard ID</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold text-center">Size & Type</th>
                <th className="py-3 px-4 font-semibold">Product / Campaign</th>
                <th className="py-3 px-4 font-semibold text-right">Rent / Month</th>
                <th className="py-3 px-4 font-semibold text-center">Days Remaining</th>
                <th className="py-3 px-4 font-semibold text-center">Operational Pipeline</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(b => {
                const endDate = new Date(b.agreementEnd);
                const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                return (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">{b.billboardId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{b.location}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{b.exactAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono text-slate-200">{b.size}</div>
                      <div className="text-[10px] text-slate-400">{b.billboardType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-amber-300">{b.currentProduct || 'None'}</div>
                      <div className="text-[11px] text-slate-400">{b.currentCampaign}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${b.rentPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                        diffDays <= 10
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : diffDays <= 30
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {diffDays > 0 ? `Expires in ${diffDays} days` : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                        {b.opStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canUpdate && (
                        <button
                          onClick={() => {
                            setEditingBillboard(b);
                            setBillboardId(b.billboardId);
                            setLocation(b.location);
                            setExactAddress(b.exactAddress);
                            setRentPrice(b.rentPrice);
                            setCurrentProduct(b.currentProduct || '');
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {editingBillboard ? 'Update Billboard' : 'Register New Billboard'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Set specifications, location, rent costs, & campaign assignment</p>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Billboard ID *</label>
                  <input
                    type="text"
                    required
                    value={billboardId}
                    onChange={e => setBillboardId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Location Name *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="KM4 Intersection"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Exact Address</label>
                <input
                  type="text"
                  value={exactAddress}
                  onChange={e => setExactAddress(e.target.value)}
                  placeholder="Street, landmark, district..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Monthly Rent ($ USD) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={rentPrice}
                    onChange={e => setRentPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreement End Date *</label>
                  <input
                    type="date"
                    required
                    value={agreementEnd}
                    onChange={e => setAgreementEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Current Product</label>
                  <input
                    type="text"
                    value={currentProduct}
                    onChange={e => setCurrentProduct(e.target.value)}
                    placeholder="J. Janan Oud"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Operational Pipeline Status</label>
                  <select
                    value={opStatus}
                    onChange={e => setOpStatus(e.target.value as BillboardOpStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    <option value="Artwork">Artwork</option>
                    <option value="Approved">Approved</option>
                    <option value="Printed">Printed</option>
                    <option value="Installed">Installed</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Billboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
