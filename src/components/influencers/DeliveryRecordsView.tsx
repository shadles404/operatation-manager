import React, { useState } from 'react';
import {
  Package,
  Plus,
  FileText,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  XCircle
} from 'lucide-react';
import { store } from '../../services/store';
import { DeliveryRecord, DeliveryStatus, DeliveryPaymentStatus } from '../../types';
import * as XLSX from 'xlsx';

export const DeliveryRecordsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // New Delivery Form State
  const [influencerId, setInfluencerId] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(10);
  const [date, setDate] = useState('2026-08-27');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('Sent');
  const [paymentStatus, setPaymentStatus] = useState<DeliveryPaymentStatus>('Unpaid');
  const [paymentDueDate, setPaymentDueDate] = useState('2026-09-10');
  const [notes, setNotes] = useState('');

  const deliveries = store.getDeliveries();
  const influencers = store.getInfluencers();

  const canAdd = store.hasPermission('deliveries', 'add');
  const canUpdate = store.hasPermission('deliveries', 'update');
  const canDelete = store.hasPermission('deliveries', 'delete');
  const canExport = store.hasPermission('deliveries', 'export');

  // Dashboard Stats (Section 12 KPIs)
  const paidDeliveriesCount = deliveries.filter(d => d.paymentStatus === 'Paid').length;
  const unpaidDeliveriesCount = deliveries.filter(d => d.paymentStatus === 'Unpaid').length;
  const totalPaid = deliveries.filter(d => d.paymentStatus === 'Paid').reduce((sum, d) => sum + d.paymentAmount, 0);
  const pendingAmount = deliveries
    .filter(d => d.paymentStatus === 'Unpaid' || d.paymentStatus === 'Pending Approval')
    .reduce((sum, d) => sum + d.paymentAmount, 0);

  const filtered = deliveries.filter(d =>
    d.deliveryId.toLowerCase().includes(search.toLowerCase()) ||
    d.influencerName.toLowerCase().includes(search.toLowerCase()) ||
    d.product.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filtered.length > 0 && filtered.every(d => selectedIds.includes(d.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(d => d.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteOne = (id: string, deliveryIdStr: string) => {
    if (!canDelete) {
      setPermissionError('Permission denied: Cannot delete delivery record');
      return;
    }
    if (confirm(`Are you sure you want to delete delivery record ${deliveryIdStr}?`)) {
      const res = store.deleteDelivery(id);
      if (!res.success) {
        setPermissionError(res.error || 'Failed to delete delivery record');
      } else {
        setSelectedIds(prev => prev.filter(item => item !== id));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return;
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected delivery record(s)?`)) {
      const res = await store.bulkDeleteDeliveries(selectedIds);
      if (res.success) {
        setSelectedIds([]);
      } else {
        setPermissionError(res.error || 'Failed to bulk delete delivery records');
      }
    }
  };

  const handleBulkStatus = async (status: DeliveryStatus) => {
    if (!canUpdate) return;
    if (selectedIds.length === 0) return;
    const res = await store.bulkUpdateDeliveryStatus(selectedIds, status);
    if (!res.success) {
      setPermissionError(res.error || 'Failed to bulk update status');
    }
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setPermissionError('Permission denied: You do not have permission to add delivery records');
      return;
    }
    const inf = influencers.find(i => i.id === influencerId);
    if (!inf) {
      setPermissionError('Please select a valid influencer');
      return;
    }

    const res = store.addDelivery({
      influencerId: inf.id,
      influencerName: inf.fullName,
      product,
      quantity,
      date,
      unitPrice,
      deliveryStatus,
      paymentStatus,
      paymentAmount: quantity * unitPrice,
      paymentDueDate,
      notes
    });

    if (res.success) {
      setIsModalOpen(false);
      setProduct('');
    } else {
      setPermissionError(res.error || 'Failed to add delivery');
    }
  };

  const handleExportCSV = () => {
    if (!canExport) {
      setPermissionError('Permission denied: You do not have permission to export delivery records');
      return;
    }
    const exportData = filtered.map(d => {
      const inf = store.getInfluencers().find(
        i => i.id === d.influencerId || i.fullName.toLowerCase() === d.influencerName.toLowerCase()
      );
      return {
        DeliveryID: d.deliveryId,
        Influencer: d.influencerName,
        InfluencerPhone: inf?.phone || 'N/A',
        Product: d.product,
        Quantity: d.quantity,
        Date: d.date,
        UnitPrice: d.unitPrice,
        TotalPrice: d.totalPrice,
        DeliveryStatus: d.deliveryStatus,
        PaymentStatus: d.paymentStatus,
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deliveries");
    XLSX.writeFile(wb, `Delivery_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Product Delivery Records</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Track products dispatched to influencers, delivery statuses, and payment obligations</p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Delivery</span>
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

      {/* Section 12 Delivery Dashboard KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Paid Deliveries</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{paidDeliveriesCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Unpaid Deliveries</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{unpaidDeliveriesCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Paid</div>
          <div className="text-2xl font-black text-white mt-1">${totalPaid.toFixed(2)}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Pending Amount</div>
          <div className="text-2xl font-black text-amber-400 mt-1">${pendingAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedIds.length} delivery record(s) selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <>
                <button
                  onClick={() => handleBulkStatus('Received')}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Set Received</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('Sent')}
                  className="px-3 py-1.5 bg-sky-900/60 hover:bg-sky-900 text-sky-200 border border-sky-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Set Sent</span>
                </button>
                <button
                  onClick={() => handleBulkStatus('Cancelled')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Set Cancelled</span>
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

      {/* Deliveries Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search delivery ID, product, influencer..."
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
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Delivery ID</th>
                <th className="py-3 px-4 font-semibold">Influencer</th>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold text-center">Qty</th>
                <th className="py-3 px-4 font-semibold text-center">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th className="py-3 px-4 font-semibold text-center">Delivery Status</th>
                <th className="py-3 px-4 font-semibold text-center">Payment Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(d => {
                const isSelected = selectedIds.includes(d.id);
                return (
                  <tr key={d.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleSelectOne(d.id)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{d.deliveryId}</td>
                    <td className="py-3 px-4 font-bold text-white">{d.influencerName}</td>
                    <td className="py-3 px-4 text-slate-200">{d.product}</td>
                    <td className="py-3 px-4 text-center font-mono">{d.quantity}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{d.date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">${d.totalPrice}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {d.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.paymentStatus === 'Paid'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : d.paymentStatus === 'Approved'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {d.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteOne(d.id, d.deliveryId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Delete Delivery Record"
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

      {/* New Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">New Product Delivery</h3>
            <p className="text-xs text-slate-400 mb-4">Record sample/product dispatch to influencer</p>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Influencer *</label>
                <select
                  required
                  value={influencerId}
                  onChange={e => setInfluencerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Select Influencer...</option>
                  {influencers.map(i => (
                    <option key={i.id} value={i.id}>{i.fullName} ({i.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    placeholder="e.g. Gasac Mama Milk"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit Price ($ USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={unitPrice}
                    onChange={e => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Delivery Price:</span>
                <span className="font-mono font-bold text-white text-sm">${quantity * unitPrice} USD</span>
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
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
                >
                  Record Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
