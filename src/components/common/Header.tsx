import React, { useState } from 'react';
import {
  Search,
  Bell,
  Shield,
  User,
  LogOut,
  Key,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { store } from '../../services/store';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAlerts: () => void;
  onOpenAuditLogs: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  activeNavTitle: string;
  toggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAlerts,
  onOpenAuditLogs,
  onChangePassword,
  onLogout,
  activeNavTitle,
  toggleMobileMenu,
  isMobileMenuOpen
}) => {
  const currentUser = store.getCurrentUser();
  const alerts = store.getAlerts();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="hidden sm:inline-block text-slate-400 text-xs font-mono uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Marketing Ops
              </span>
              <span>{activeNavTitle}</span>
            </h1>
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-400 text-sm transition-colors text-left group"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
            <span className="flex-1 truncate">Search influencers, billboards, LCDs, payments...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-700 text-slate-300 rounded border border-slate-600">
              ⌘K / Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Global Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Audit Logs Trigger (Admin / High Access) */}
          <button
            onClick={onOpenAuditLogs}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="System Audit Trail"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Audit Trail</span>
          </button>

          {/* Notifications / Alerts Drawer */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Notifications & Operational Alerts"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {alerts.length}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <img
                src={currentUser?.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                alt={currentUser?.fullName || "User Avatar"}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser?.fullName}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  {currentUser?.role === 'admin' ? 'Main Admin' : 'Sub-User'}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 text-slate-200 z-50 divide-y divide-slate-800"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-white">{currentUser?.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Role: {currentUser?.role.toUpperCase()}</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onChangePassword();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <Key className="w-4 h-4 text-slate-400" />
                    <span>Change Password</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
