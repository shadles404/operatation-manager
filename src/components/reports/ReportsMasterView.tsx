import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Users,
  Building2,
  Monitor,
  Wallet,
  CreditCard,
  PieChart,
  BarChart,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { store } from '../../services/store';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const ReportsMasterView: React.FC = () => {
  const [reportType, setReportType] = useState<
    'Influencer' | 'Billboard' | 'LCD Screen' | 'Budget' | 'Payment' | 'Monthly Operations'
  >('Monthly Operations');

  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');

  const influencers = store.getInfluencers();
  const targets = store.getTargets();
  const deliveries = store.getDeliveries();
  const billboards = store.getBillboards();
  const lcdScreens = store.getLCDScreens();
  const budgets = store.getBudgets();
  const payments = store.getPayments();
  const expenses = store.getExpenses();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(234, 179, 8); // amber
    doc.text(`EXECUTIVE OPERATIONAL REPORT: ${reportType.toUpperCase()}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Marketing Operations Management System", 14, 26);
    doc.text(`Period: ${startDate} to ${endDate} | Date Generated: ${new Date().toLocaleString()}`, 14, 32);

    doc.line(14, 36, 196, 36);

    doc.setFontSize(12);
    doc.setTextColor(0);

    if (reportType === 'Monthly Operations') {
      doc.text("1. INFLUENCER ROSTER SUMMARY", 14, 46);
      doc.setFontSize(10);
      doc.text(`Active Influencers: ${influencers.filter(i => i.status === 'Active').length}`, 14, 52);
      doc.text(`Target Videos Assigned: ${targets.reduce((s, t) => s + t.targetVideos, 0)}`, 14, 58);
      doc.text(`Completed Videos: ${targets.reduce((s, t) => s + t.completedVideos, 0)}`, 14, 64);

      doc.setFontSize(12);
      doc.text("2. OUTDOOR MEDIA ASSETS", 14, 76);
      doc.setFontSize(10);
      doc.text(`Billboards Total Active: ${billboards.filter(b => b.status === 'Active').length}`, 14, 82);
      doc.text(`LCD Screens Total Active: ${lcdScreens.filter(l => l.status === 'Active').length}`, 14, 88);

      doc.setFontSize(12);
      doc.text("3. BUDGET & DISBURSEMENT", 14, 100);
      doc.setFontSize(10);
      doc.text(`Total Budget Pool Allocated: $${budgets.reduce((s, b) => s + b.allocated, 0).toLocaleString()} USD`, 14, 106);
      doc.text(`Total Spent: $${budgets.reduce((s, b) => s + b.spent, 0).toLocaleString()} USD`, 14, 112);
      doc.text(`Remaining Liquidity: $${budgets.reduce((s, b) => s + b.remaining, 0).toLocaleString()} USD`, 14, 118);
    } else if (reportType === 'Influencer') {
      let y = 46;
      targets.forEach((t, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ${t.influencerName} - Target: ${t.targetVideos} vids | Done: ${t.completedVideos} | Achieved: ${t.achievementPercent}%`, 14, y);
        y += 8;
      });
    } else if (reportType === 'Billboard') {
      let y = 46;
      billboards.forEach((b, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ${b.billboardId} (${b.location}) - Product: ${b.currentProduct || 'None'} | Rent: $${b.rentPrice}/mo`, 14, y);
        y += 8;
      });
    } else if (reportType === 'Budget') {
      let y = 46;
      budgets.forEach((b, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. [${b.budgetType}] ${b.category} - Allocated: $${b.allocated} | Spent: $${b.spent} | Remain: $${b.remaining}`, 14, y);
        y += 8;
      });
    }

    doc.save(`Report_${reportType}_${startDate}_to_${endDate}.pdf`);
  };

  const handleExportExcel = () => {
    let data: any[] = [];
    if (reportType === 'Influencer') {
      data = targets.map(t => ({ Influencer: t.influencerName, Month: t.monthYear, Target: t.targetVideos, Completed: t.completedVideos, Remaining: t.remainingVideos, AchievementPct: t.achievementPercent, Status: t.status }));
    } else if (reportType === 'Billboard') {
      data = billboards.map(b => ({ BillboardID: b.billboardId, Location: b.location, Size: b.size, Rent: b.rentPrice, Product: b.currentProduct, Status: b.status, EndDate: b.agreementEnd }));
    } else if (reportType === 'LCD Screen') {
      data = lcdScreens.map(l => ({ ScreenID: l.screenId, Name: l.screenName, Location: l.location, Rent: l.rentPrice, EndDate: l.agreementEnd }));
    } else if (reportType === 'Budget') {
      data = budgets.map(b => ({ Type: b.budgetType, Category: b.category, Allocated: b.allocated, Spent: b.spent, Committed: b.committed, Remaining: b.remaining, Status: b.warningLevel }));
    } else if (reportType === 'Payment') {
      data = payments.map(p => ({ PaymentID: p.paymentId, Type: p.paymentType, Recipient: p.recipient, Amount: p.amount, Status: p.status, DueDate: p.dueDate }));
    } else {
      data = expenses.map(e => ({ ExpenseID: e.expenseId, Category: e.category, Amount: e.amount, Date: e.date, Description: e.description }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportType);
    XLSX.writeFile(wb, `Report_${reportType}_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Operational Reporting & Executive Export Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Generate verified PDF executive briefs & detailed Excel audit datasets across all marketing functions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Download Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'Influencer', title: 'Influencer Report', icon: Users, color: 'text-amber-400' },
          { id: 'Billboard', title: 'Billboard Report', icon: Building2, color: 'text-sky-400' },
          { id: 'LCD Screen', title: 'LCD Screen Report', icon: Monitor, color: 'text-purple-400' },
          { id: 'Budget', title: 'Budget Report', icon: Wallet, color: 'text-emerald-400' },
          { id: 'Payment', title: 'Payment Report', icon: CreditCard, color: 'text-yellow-400' },
          { id: 'Monthly Operations', title: 'Monthly Operations', icon: PieChart, color: 'text-rose-400' },
        ].map(item => {
          const Icon = item.icon;
          const isSelected = reportType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setReportType(item.id as any)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-amber-400/80 shadow-lg ring-1 ring-amber-400/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.color} mb-3`} />
              <div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Click to view preview</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-amber-400" /> Date Period:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
          />
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Active Filter: <span className="text-amber-400 font-bold">{reportType}</span>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{reportType} Executive Audit Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live aggregated dataset preview for period {startDate} to {endDate}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold border border-amber-500/30">
            Preview Mode
          </span>
        </div>

        {reportType === 'Monthly Operations' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <h3 className="font-bold text-amber-400 mb-2">Influencers Operations</h3>
              <p className="text-slate-300">Total Active Influencers: {influencers.filter(i => i.status === 'Active').length}</p>
              <p className="text-slate-300">Target Videos: {targets.reduce((s, t) => s + t.targetVideos, 0)} vids</p>
              <p className="text-slate-300">Completed Videos: {targets.reduce((s, t) => s + t.completedVideos, 0)} vids</p>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <h3 className="font-bold text-sky-400 mb-2">Outdoor Media</h3>
              <p className="text-slate-300">Billboards Active: {billboards.filter(b => b.status === 'Active').length}</p>
              <p className="text-slate-300">LCD Screens Active: {lcdScreens.filter(l => l.status === 'Active').length}</p>
              <p className="text-slate-300">Expiring in &lt;15 days: {billboards.filter(b => b.status === 'Active').length + lcdScreens.filter(l => l.status === 'Active').length}</p>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <h3 className="font-bold text-emerald-400 mb-2">Financial Liquidity</h3>
              <p className="text-slate-300">Allocated Pool: ${budgets.reduce((s, b) => s + b.allocated, 0).toLocaleString()} USD</p>
              <p className="text-slate-300">Total Spent: ${budgets.reduce((s, b) => s + b.spent, 0).toLocaleString()} USD</p>
              <p className="text-slate-300">Remaining Pool: ${budgets.reduce((s, b) => s + b.remaining, 0).toLocaleString()} USD</p>
            </div>
          </div>
        )}

        {reportType === 'Influencer' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Influencer</th>
                  <th className="py-2.5 px-3 text-center">Target</th>
                  <th className="py-2.5 px-3 text-center">Completed</th>
                  <th className="py-2.5 px-3 text-center">Remaining</th>
                  <th className="py-2.5 px-3 text-right">Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {targets.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 px-3 font-bold text-white">{t.influencerName}</td>
                    <td className="py-2 px-3 text-center font-mono">{t.targetVideos}</td>
                    <td className="py-2 px-3 text-center font-mono text-amber-400">{t.completedVideos}</td>
                    <td className="py-2 px-3 text-center font-mono">{t.remainingVideos}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">{t.achievementPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'Budget' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Allocated</th>
                  <th className="py-2.5 px-3 text-right">Spent</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {budgets.map(b => (
                  <tr key={b.id}>
                    <td className="py-2 px-3 font-bold text-amber-400">{b.budgetType}</td>
                    <td className="py-2 px-3 text-white">{b.category}</td>
                    <td className="py-2 px-3 text-right font-mono">${b.allocated.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-300">${b.spent.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">${b.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
