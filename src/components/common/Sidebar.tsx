import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Tv,
  Monitor,
  Wallet,
  CreditCard,
  FileBarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building2,
  PackageCheck,
  CheckCircle,
  FileText
} from 'lucide-react';
import { store } from '../../services/store';
import { PermissionModule } from '../../types';

export interface NavSelection {
  section: string;
  subSection?: string;
}

interface SidebarProps {
  currentNav: NavSelection;
  onSelectNav: (nav: NavSelection) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  isMobileOpen,
  onCloseMobile
}) => {
  const currentUser = store.getCurrentUser();

  // Accordion open state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Influencers: true,
    Billboards: true,
    LCD: true,
    Budget: true,
    Payments: true,
    Reports: true,
    Settings: true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isModuleVisible = (module: PermissionModule): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const perms = currentUser.permissions?.[module];
    return !!perms?.view;
  };

  const handleItemClick = (section: string, subSection?: string) => {
    onSelectNav({ section, subSection });
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 z-40 h-full w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Logo & Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            M
          </div>
          <div>
            <h2 className="font-bold text-white text-base tracking-tight leading-none">
              Marketing Ops
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Enterprise Operations</p>
          </div>
        </div>

        {/* Navigation Link Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          {/* Dashboard */}
          {isModuleVisible('dashboard') && (
            <button
              onClick={() => handleItemClick('Dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-left ${
                currentNav.section === 'Dashboard'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Influencers Accordion */}
          {isModuleVisible('influencers') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('Influencers')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Influencers</span>
                </div>
                {openGroups.Influencers ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.Influencers && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('Influencers', 'All Influencers')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Influencers' && currentNav.subSection === 'All Influencers'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    All Influencers
                  </button>
                  {isModuleVisible('targets') && (
                    <button
                      onClick={() => handleItemClick('Influencers', 'Target Tracking')}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                        currentNav.section === 'Influencers' && currentNav.subSection === 'Target Tracking'
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Target Tracking
                    </button>
                  )}
                  {isModuleVisible('deliveries') && (
                    <button
                      onClick={() => handleItemClick('Influencers', 'Delivery Records')}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                        currentNav.section === 'Influencers' && currentNav.subSection === 'Delivery Records'
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Delivery Records
                    </button>
                  )}
                  {isModuleVisible('influencer_payments') && (
                    <button
                      onClick={() => handleItemClick('Influencers', 'Payments')}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                        currentNav.section === 'Influencers' && currentNav.subSection === 'Payments'
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Payments
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Billboards Accordion */}
          {isModuleVisible('billboards') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('Billboards')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Billboards</span>
                </div>
                {openGroups.Billboards ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.Billboards && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('Billboards', 'All Billboards')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Billboards' && currentNav.subSection === 'All Billboards'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    All Billboards
                  </button>
                  {isModuleVisible('billboard_payments') && (
                    <button
                      onClick={() => handleItemClick('Billboards', 'Payments')}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                        currentNav.section === 'Billboards' && currentNav.subSection === 'Payments'
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Payments
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LCD Screens Accordion */}
          {isModuleVisible('lcd_screens') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('LCD')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-purple-400" />
                  <span>LCD Screens</span>
                </div>
                {openGroups.LCD ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.LCD && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('LCD Screens', 'LCD Registration')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'LCD Screens' && currentNav.subSection === 'LCD Registration'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    LCD Registration
                  </button>
                  {isModuleVisible('lcd_payments') && (
                    <button
                      onClick={() => handleItemClick('LCD Screens', 'Payments')}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                        currentNav.section === 'LCD Screens' && currentNav.subSection === 'Payments'
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Payments
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Budget Accordion */}
          {isModuleVisible('budget') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('Budget')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Budget</span>
                </div>
                {openGroups.Budget ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.Budget && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('Budget', 'Local')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Budget' && currentNav.subSection === 'Local'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Local Budget
                  </button>
                  <button
                    onClick={() => handleItemClick('Budget', 'International')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Budget' && currentNav.subSection === 'International'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    International Budget
                  </button>
                  {isModuleVisible('expenses') && (
                    <button
                      onClick={() => handleItemClick('Budget', 'Expenses')}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                        currentNav.section === 'Budget' && currentNav.subSection === 'Expenses'
                          ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Expenses
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payments Accordion */}
          {(isModuleVisible('influencer_payments') || isModuleVisible('billboard_payments') || isModuleVisible('lcd_payments')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('Payments')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payments</span>
                </div>
                {openGroups.Payments ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.Payments && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('Payments', 'All Payments')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Payments' && currentNav.subSection === 'All Payments'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    All Payments
                  </button>
                  <button
                    onClick={() => handleItemClick('Payments', 'Pending')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Payments' && currentNav.subSection === 'Pending'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleItemClick('Payments', 'Approved')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Payments' && currentNav.subSection === 'Approved'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => handleItemClick('Payments', 'Paid')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Payments' && currentNav.subSection === 'Paid'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reports Accordion */}
          {isModuleVisible('reports') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('Reports')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <FileBarChart className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reports</span>
                </div>
                {openGroups.Reports ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.Reports && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('Reports', 'Influencer')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Reports' && currentNav.subSection === 'Influencer'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Influencer Report
                  </button>
                  <button
                    onClick={() => handleItemClick('Reports', 'Billboard')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Reports' && currentNav.subSection === 'Billboard'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Billboard Report
                  </button>
                  <button
                    onClick={() => handleItemClick('Reports', 'LCD Screen')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Reports' && currentNav.subSection === 'LCD Screen'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    LCD Screen Report
                  </button>
                  <button
                    onClick={() => handleItemClick('Reports', 'Budget')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Reports' && currentNav.subSection === 'Budget'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Budget Report
                  </button>
                  <button
                    onClick={() => handleItemClick('Reports', 'Payment')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Reports' && currentNav.subSection === 'Payment'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Payment Report
                  </button>
                  <button
                    onClick={() => handleItemClick('Reports', 'Monthly Operations')}
                    className={`w-full text-left px-3 py-1.5 rounded-md font-bold transition-colors text-amber-400 ${
                      currentNav.section === 'Reports' && currentNav.subSection === 'Monthly Operations'
                        ? 'bg-amber-500/20 text-amber-300 border-l-2 border-amber-400'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    Monthly Operations
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings / Admin Accordion */}
          {isModuleVisible('users') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('Settings')}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white font-semibold uppercase tracking-wider text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings</span>
                </div>
                {openGroups.Settings ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openGroups.Settings && (
                <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleItemClick('Settings', 'Users & Permissions')}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors ${
                      currentNav.section === 'Settings' && currentNav.subSection === 'Users & Permissions'
                        ? 'bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    Users & Permissions
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer User Badge */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="font-mono">Security: RBAC Enforced</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">v1.0</span>
        </div>
      </aside>
    </>
  );
};
