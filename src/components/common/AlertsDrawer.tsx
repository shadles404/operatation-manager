import React from 'react';
import { X, Bell, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { store } from '../../services/store';
import { NavSelection } from './Sidebar';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (nav: NavSelection) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  if (!isOpen) return null;

  const alerts = store.getAlerts();

  const handleAlertClick = (actionUrl?: string) => {
    if (!actionUrl) return;
    if (actionUrl.includes('/influencers/targets')) {
      onNavigate({ section: 'Influencers', subSection: 'Target Tracking' });
    } else if (actionUrl.includes('/influencers/deliveries')) {
      onNavigate({ section: 'Influencers', subSection: 'Delivery Records' });
    } else if (actionUrl.includes('/influencers')) {
      onNavigate({ section: 'Influencers', subSection: 'All Influencers' });
    } else if (actionUrl.includes('/billboards')) {
      onNavigate({ section: 'Billboards', subSection: 'All Billboards' });
    } else if (actionUrl.includes('/lcd-screens')) {
      onNavigate({ section: 'LCD Screens', subSection: 'All LCD Screens' });
    } else if (actionUrl.includes('/budget')) {
      onNavigate({ section: 'Budget', subSection: 'Expenses' });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Attention Required</h2>
              <p className="text-xs text-slate-400">{alerts.length} operational alerts & warnings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p className="font-semibold text-white">All Operations Nominal</p>
              <p className="text-xs text-slate-500 mt-1">No overdue contracts, unpaid deliveries, or budget breaches at this time.</p>
            </div>
          ) : (
            alerts.map(alt => (
              <div
                key={alt.id}
                onClick={() => handleAlertClick(alt.actionUrl)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                  alt.type === 'danger'
                    ? 'bg-rose-950/30 border-rose-800/60 hover:border-rose-600'
                    : 'bg-amber-950/30 border-amber-800/60 hover:border-amber-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {alt.type === 'danger' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {alt.module}
                      </div>
                      <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5">
                        {alt.title}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alt.message}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 mt-1 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 text-center">
          Automatic system monitor • Updated live
        </div>
      </div>
    </div>
  );
};
