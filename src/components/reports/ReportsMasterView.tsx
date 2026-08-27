import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Building2,
  Monitor,
  Wallet,
  CreditCard,
  PieChart,
  CheckCircle2,
  XCircle,
  Printer,
  TrendingUp,
  AlertCircle
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

  // Real-time Firebase data from store
  const influencers = store.getInfluencers();
  const targets = store.getTargets();
  const billboards = store.getBillboards();
  const lcdScreens = store.getLCDScreens();
  const budgets = store.getBudgets();
  const payments = store.getPayments();

  // 1. Calculate Aggregated Report Data
  // Influencer Aggregates
  const totalTargetVideos = targets.reduce((sum, t) => sum + t.targetVideos, 0);
  const totalCompletedVideos = targets.reduce((sum, t) => sum + (t.completedVideos || 0), 0);
  const pendingTargetsCount = targets.filter(t => (t.completedVideos || 0) < t.targetVideos).length;
  const metTargetsCount = targets.filter(t => (t.completedVideos || 0) >= t.targetVideos).length;
  const overallPerformancePct = totalTargetVideos > 0 ? Math.round((totalCompletedVideos / totalTargetVideos) * 100) : 0;

  // Billboard Aggregates
  const totalBillboards = billboards.length;
  const activeBillboards = billboards.filter(b => b.status === 'Active').length;
  const totalBillboardRent = billboards.reduce((sum, b) => sum + b.rentPrice, 0);
  const billboardOccupancyPct = totalBillboards > 0 ? Math.round((activeBillboards / totalBillboards) * 100) : 0;

  // LCD Aggregates
  const totalLCDs = lcdScreens.length;
  const activeLCDs = lcdScreens.filter(l => l.status === 'Active').length;
  const totalLCDRent = lcdScreens.reduce((sum, l) => sum + l.rentPrice, 0);
  const lcdActivePct = totalLCDs > 0 ? Math.round((activeLCDs / totalLCDs) * 100) : 0;

  // Budget Aggregates
  const totalPlannedBudget = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpentBudget = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemainingBudget = budgets.reduce((sum, b) => sum + b.remaining, 0);
  const budgetBurnRate = totalPlannedBudget > 0 ? Math.round((totalSpentBudget / totalPlannedBudget) * 100) : 0;

  // Payment Aggregates
  const totalPaymentTransactions = payments.length;
  const paidPaymentsAmount = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingPaymentsAmount = payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingTransactionsCount = payments.filter(p => p.status !== 'Paid').length;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(234, 179, 8); // Amber-500
    doc.text(`EXECUTIVE AUDIT REPORT: ${reportType.toUpperCase()}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Marketing Operations Management System", 14, 26);
    doc.text(`Reporting Window: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleString()}`, 14, 32);

    doc.setDrawColor(30, 41, 59); // slate-800
    doc.line(14, 36, 196, 36);

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    if (reportType === 'Monthly Operations') {
      doc.setFontSize(13);
      doc.text("1. MARKETING PERFORMANCE KPI OVERVIEW", 14, 46);
      doc.setFontSize(10);
      doc.text(`* Influencer Completed Videos: ${totalCompletedVideos} / ${totalTargetVideos} (${overallPerformancePct}% performance)`, 16, 54);
      doc.text(`* Active Billboard Venues: ${activeBillboards} / ${totalBillboards} (${billboardOccupancyPct}% occupancy rate)`, 16, 60);
      doc.text(`* Registered LCD Screens: ${activeLCDs} / ${totalLCDs} screens online`, 16, 66);
      doc.text(`* Budget Consumption: $${totalSpentBudget.toLocaleString()} USD used / $${totalPlannedBudget.toLocaleString()} USD total`, 16, 72);

      doc.setFontSize(13);
      doc.text("2. EXECUTIVE DISBURSEMENT STATUS", 14, 84);
      doc.setFontSize(10);
      doc.text(`* Total Disbursed & Paid: $${paidPaymentsAmount.toLocaleString()} USD`, 16, 92);
      doc.text(`* Total Pending Release: $${pendingPaymentsAmount.toLocaleString()} USD`, 16, 98);
      doc.text(`* Pending Invoices/Vouchers: ${pendingTransactionsCount} records`, 16, 104);

      doc.setFontSize(13);
      doc.text("3. MONTHLY CRITICAL NOTATIONS", 14, 116);
      doc.setFontSize(10);
      doc.text("All digital outdoor channels, LCD displays, and influencer campaigns are aligned", 16, 124);
      doc.text("with central real-time database synchronization. No manual overhead was observed.", 16, 130);
    } else if (reportType === 'Influencer') {
      doc.setFontSize(13);
      doc.text("INFLUENCER TARGETS & PERFORMANCE ROSTER", 14, 46);
      doc.setFontSize(9);
      let y = 56;
      targets.forEach((t, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const status = t.completedVideos >= t.targetVideos ? "ACHIEVED" : "IN PROGRESS";
        doc.text(`${idx + 1}. ${t.influencerName} | Target: ${t.targetVideos} | Done: ${t.completedVideos} | Perf: ${t.achievementPercent}% | Status: ${status}`, 14, y);
        y += 8;
      });
    } else if (reportType === 'Billboard') {
      doc.setFontSize(13);
      doc.text("BILLBOARD ASSETS & LEASE CAMPAIGNS", 14, 46);
      doc.setFontSize(9);
      let y = 56;
      billboards.forEach((b, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ID: ${b.billboardId} | Loc: ${b.location} | Rent: $${b.rentPrice}/mo | Status: ${b.status} | Camp: ${b.currentProduct || 'None'}`, 14, y);
        y += 8;
      });
    } else if (reportType === 'LCD Screen') {
      doc.setFontSize(13);
      doc.text("LCD SCREEN REGISTRATION & VIDEO STREAM AGREEMENTS", 14, 46);
      doc.setFontSize(9);
      let y = 56;
      lcdScreens.forEach((l, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ID: ${l.screenId} | Vendor: ${l.screenName} | Video: ${l.currentProduct || 'None'} | Res: ${l.resolution} | Price: $${l.rentPrice}/mo`, 14, y);
        y += 8;
      });
    } else if (reportType === 'Budget') {
      doc.setFontSize(13);
      doc.text("CENTRAL PLANNED BUDGET ALLOCATION AND SPENDING", 14, 46);
      doc.setFontSize(9);
      let y = 56;
      budgets.forEach((b, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. [${b.budgetType}] ${b.category} | Allocated: $${b.allocated.toLocaleString()} | Spent: $${b.spent.toLocaleString()} | Remaining: $${b.remaining.toLocaleString()} (${b.warningLevel})`, 14, y);
        y += 8;
      });
    } else if (reportType === 'Payment') {
      doc.setFontSize(13);
      doc.text("CENTRAL DISBURSEMENTS & PAYMENTS ROSTER", 14, 46);
      doc.setFontSize(9);
      let y = 56;
      payments.forEach((p, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ID: ${p.paymentId} | Recipient: ${p.recipient} | Amt: $${p.amount.toLocaleString()} | Status: ${p.status} | Due: ${p.dueDate}`, 14, y);
        y += 8;
      });
    }

    doc.save(`Operational_Report_${reportType.replace(' ', '_')}_${startDate}_to_${endDate}.pdf`);
  };

  const handleExportExcel = () => {
    let data: any[] = [];
    if (reportType === 'Influencer') {
      data = targets.map(t => ({
        Influencer_Name: t.influencerName,
        Campaign_Month: t.monthYear,
        Target_Videos: t.targetVideos,
        Completed_Videos: t.completedVideos,
        Pending_Videos: t.remainingVideos,
        Target_Reached: t.completedVideos >= t.targetVideos ? 'Yes' : 'No',
        Performance_Ratio: `${t.achievementPercent}%`
      }));
    } else if (reportType === 'Billboard') {
      data = billboards.map(b => ({
        Billboard_ID: b.billboardId,
        Location_Zone: b.location,
        Screen_Size: b.size,
        Monthly_Rental: b.rentPrice,
        Current_Campaign: b.currentProduct || 'None',
        Status: b.status,
        Contract_Expiry: b.agreementEnd
      }));
    } else if (reportType === 'LCD Screen') {
      data = lcdScreens.map(l => ({
        Screen_ID: l.screenId,
        Vendor_Name: l.screenName,
        Video_Played: l.currentProduct || 'None',
        Resolution: l.resolution,
        Monthly_Price: l.rentPrice,
        Agreement_Start: l.agreementStart,
        Agreement_End: l.agreementEnd,
        Status: l.status
      }));
    } else if (reportType === 'Budget') {
      data = budgets.map(b => ({
        Budget_Type: b.budgetType,
        Category: b.category,
        Allocated_Pool: b.allocated,
        Spent_Amount: b.spent,
        Committed_Funds: b.committed,
        Remaining_Liquidity: b.remaining,
        Warning_Status: b.warningLevel
      }));
    } else if (reportType === 'Payment') {
      data = payments.map(p => ({
        Payment_ID: p.paymentId,
        Payment_Type: p.paymentType,
        Recipient_Name: p.recipient,
        Amount: p.amount,
        Disbursement_Status: p.status,
        Due_Date: p.dueDate,
        Payment_Notes: p.notes || ''
      }));
    } else {
      // Monthly Operations Combined Dataset
      data = [
        { KPI: 'Active Influencers', Value: influencers.filter(i => i.status === 'Active').length },
        { KPI: 'Target Videos Assigned', Value: totalTargetVideos },
        { KPI: 'Completed Videos Streamed', Value: totalCompletedVideos },
        { KPI: 'Overall Influencer Performance', Value: `${overallPerformancePct}%` },
        { KPI: 'Total Billboards Registered', Value: totalBillboards },
        { KPI: 'Active Billboard Leases', Value: activeBillboards },
        { KPI: 'Total Registered LCD Screens', Value: totalLCDs },
        { KPI: 'Active LCD Displays', Value: activeLCDs },
        { KPI: 'Total Planned Budget pool', Value: `$${totalPlannedBudget.toLocaleString()}` },
        { KPI: 'Total Spent Budget pool', Value: `$${totalSpentBudget.toLocaleString()}` },
        { KPI: 'Total Paid Disbursements', Value: `$${paidPaymentsAmount.toLocaleString()}` },
        { KPI: 'Total Pending Invoices', Value: `$${pendingPaymentsAmount.toLocaleString()}` }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Operational_Report");
    XLSX.writeFile(wb, `Operational_Report_${reportType.replace(' ', '_')}_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Executive Reporting Centre</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time aggregated compliance reporting & structured multi-format document downloads</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF Brief</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
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
                <div className="text-xs font-bold text-white leading-tight">{item.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">Live metrics</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-amber-400" /> Reporting Period:
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
          Target Type: <span className="text-amber-400 font-bold">{reportType}</span>
        </div>
      </div>

      {/* Dynamic Aggregate Stats for Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportType === 'Influencer' && (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Targets Assigned</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{totalTargetVideos}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Assigned video campaigns</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Completed Videos</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{totalCompletedVideos}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Successfully delivered</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Targets Achieved vs Pending</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{metTargetsCount} / {pendingTargetsCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Achieved / Not-reached</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Performance Ratio</div>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{overallPerformancePct}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Completion efficiency</div>
            </div>
          </>
        )}

        {reportType === 'Billboard' && (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Billboard Assets</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{totalBillboards}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Registered locations</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Leases</div>
              <div className="text-xl font-bold text-sky-400 mt-1 font-mono">{activeBillboards}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Under current contract</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Monthly Rental Cost</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">${totalBillboardRent.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">USD monthly liability</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Occupancy Rate</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{billboardOccupancyPct}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Asset utilization</div>
            </div>
          </>
        )}

        {reportType === 'LCD Screen' && (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Registered LCD Screens</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{totalLCDs}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Screens listed online</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Screen Plays</div>
              <div className="text-xl font-bold text-purple-400 mt-1 font-mono">{activeLCDs}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Actively broadcasting videos</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Lease Price</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">${totalLCDRent.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">USD monthly leases</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Online Screen Ratio</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{lcdActivePct}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Broadcasting status</div>
            </div>
          </>
        )}

        {reportType === 'Budget' && (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Planned Planned Budget</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">${totalPlannedBudget.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Allocated fund pool</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Disbursed Spending</div>
              <div className="text-xl font-bold text-rose-400 mt-1 font-mono">${totalSpentBudget.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total spent till date</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Remaining Budget</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">${totalRemainingBudget.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unspent liquidity</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Consumption Burn Rate</div>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{budgetBurnRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Of overall budget allocation</div>
            </div>
          </>
        )}

        {reportType === 'Payment' && (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Disbursements</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{totalPaymentTransactions}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Central invoice tracks</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Paid Amount</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">${paidPaymentsAmount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Released funds</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Amount</div>
              <div className="text-xl font-bold text-yellow-400 mt-1 font-mono">${pendingPaymentsAmount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Held / pending approval</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Tasks</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{pendingTransactionsCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Awaiting release</div>
            </div>
          </>
        )}

        {reportType === 'Monthly Operations' && (
          <>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Marketing Activities</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {totalTargetVideos + totalBillboards + totalLCDs}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Overall registered items</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Completed Tasks</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                {totalCompletedVideos + activeBillboards + activeLCDs}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Active & successful channels</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Campaigns</div>
              <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
                {billboards.filter(b => b.currentProduct).length + lcdScreens.filter(l => l.currentProduct).length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Active outdoor video streams</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Budget Efficiency</div>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
                {100 - budgetBurnRate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Remaining unspent factor</div>
            </div>
          </>
        )}
      </div>

      {/* Preview Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{reportType} Document Data Summary</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live compliance preview of Firestore aggregated data layers</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30 uppercase tracking-wider">
            Live Preview
          </span>
        </div>

        {/* 1. INFLUENCER REPORT */}
        {reportType === 'Influencer' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Influencer Name</th>
                  <th className="py-3 px-4 font-semibold text-center">Month</th>
                  <th className="py-3 px-4 font-semibold text-center">Target Videos</th>
                  <th className="py-3 px-4 font-semibold text-center">Completed</th>
                  <th className="py-3 px-4 font-semibold text-center">Reached Target?</th>
                  <th className="py-3 px-4 font-semibold text-center">Remaining</th>
                  <th className="py-3 px-4 font-semibold text-right">Performance Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {targets.map(t => {
                  const reached = t.completedVideos >= t.targetVideos;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-white">{t.influencerName}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{t.monthYear}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">{t.targetVideos}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">{t.completedVideos}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          reached ? 'bg-emerald-950 text-emerald-300 border border-emerald-850' : 'bg-amber-950/60 text-amber-300 border border-amber-900'
                        }`}>
                          {reached ? 'Reached' : 'Not Reached'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{t.remainingVideos}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">{t.achievementPercent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. BILLBOARD REPORT */}
        {reportType === 'Billboard' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Billboard ID</th>
                  <th className="py-3 px-4 font-semibold">Location Zone</th>
                  <th className="py-3 px-4 font-semibold text-center">Resolution / Size</th>
                  <th className="py-3 px-4 font-semibold text-right">Rental Cost / Month</th>
                  <th className="py-3 px-4 font-semibold text-center">Campaign Information</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Agreement End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {billboards.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{b.billboardId}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{b.location}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{b.size}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${b.rentPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-850 border border-slate-700 text-amber-400">
                        {b.currentProduct || 'None'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Active' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{b.agreementEnd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. LCD SCREEN REPORT */}
        {reportType === 'LCD Screen' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Screen ID</th>
                  <th className="py-3 px-4 font-semibold">Vendor / Screen Name</th>
                  <th className="py-3 px-4 font-semibold">Video Played</th>
                  <th className="py-3 px-4 font-semibold text-center">Resolution</th>
                  <th className="py-3 px-4 font-semibold text-right">Lease Price</th>
                  <th className="py-3 px-4 font-semibold text-center">Agreement Dates</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {lcdScreens.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{l.screenId}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{l.screenName}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-850 border border-slate-700 text-amber-400 font-bold">
                        {l.currentProduct || 'None'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{l.resolution}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${l.rentPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {l.agreementStart} to {l.agreementEnd}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'Active' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. BUDGET REPORT */}
        {reportType === 'Budget' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Budget Category</th>
                  <th className="py-3 px-4 font-semibold">Budget Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Planned Budget</th>
                  <th className="py-3 px-4 font-semibold text-right">Spending</th>
                  <th className="py-3 px-4 font-semibold text-right">Committed</th>
                  <th className="py-3 px-4 font-semibold text-right">Remaining Budget</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {budgets.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-white">{b.category}</td>
                    <td className="py-3.5 px-4 text-amber-400 font-semibold">{b.budgetType}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">${b.allocated.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-300">${b.spent.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">${b.committed.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">${b.remaining.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.warningLevel === 'Normal' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {b.warningLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PAYMENT REPORT */}
        {reportType === 'Payment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Payment ID</th>
                  <th className="py-3 px-4 font-semibold">Recipient</th>
                  <th className="py-3 px-4 font-semibold">Payment Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{p.paymentId}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{p.recipient}</td>
                    <td className="py-3.5 px-4 text-amber-400">{p.paymentType}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${p.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Paid' ? 'bg-emerald-950 text-emerald-300' : 'bg-yellow-950 text-yellow-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{p.dueDate}</td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[200px]" title={p.notes}>{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. MONTHLY OPERATIONS */}
        {reportType === 'Monthly Operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-3">
                <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  <Users className="w-4 h-4" />
                  <span>Influencer & Completed Tasks</span>
                </h3>
                <ul className="space-y-2 text-slate-300 text-xs">
                  <li className="flex justify-between">
                    <span>Active Influencers:</span>
                    <span className="font-bold text-white">{influencers.filter(i => i.status === 'Active').length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Assigned Video Targets:</span>
                    <span className="font-bold text-white">{totalTargetVideos} vids</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Completed Video Campaigns:</span>
                    <span className="font-bold text-emerald-400">{totalCompletedVideos} vids</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Unreached Targets:</span>
                    <span className="font-bold text-amber-400">{pendingTargetsCount} influencers</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-3">
                <h3 className="font-bold text-sky-400 flex items-center gap-1.5 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>Outdoor Campaigns & Displays</span>
                </h3>
                <ul className="space-y-2 text-slate-300 text-xs">
                  <li className="flex justify-between">
                    <span>Registered Billboards:</span>
                    <span className="font-bold text-white">{totalBillboards} locations</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Active Billboard Leases:</span>
                    <span className="font-bold text-white">{activeBillboards} screens</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Registered LCD Screens:</span>
                    <span className="font-bold text-white">{totalLCDs} screens</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Active LCD Broadcasters:</span>
                    <span className="font-bold text-purple-400">{activeLCDs} screens</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-850 border border-slate-800 p-5 rounded-xl space-y-3">
              <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                <Wallet className="w-4 h-4" />
                <span>Financial Spending & Cash Flow Efficiency</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <div className="text-slate-400">Total Planned Pool</div>
                  <div className="text-base font-bold text-white mt-1">${totalPlannedBudget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Disbursed Spending</div>
                  <div className="text-base font-bold text-rose-300 mt-1">${totalSpentBudget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Remaining Liquidity</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">${totalRemainingBudget.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
