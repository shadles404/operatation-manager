import React, { useState, useEffect } from 'react';
import { Search, X, Users, Building2, Monitor, CreditCard, ArrowRight, Package } from 'lucide-react';
import { store } from '../../services/store';
import { NavSelection } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (nav: NavSelection, detailId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal via custom event or prop
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const influencers = store.getInfluencers().filter(i =>
    i.fullName.toLowerCase().includes(query.toLowerCase()) ||
    (i.tiktokUsername && i.tiktokUsername.toLowerCase().includes(query.toLowerCase())) ||
    i.category.toLowerCase().includes(query.toLowerCase())
  );

  const deliveries = store.getDeliveries().filter(d =>
    d.deliveryId.toLowerCase().includes(query.toLowerCase()) ||
    d.influencerName.toLowerCase().includes(query.toLowerCase()) ||
    d.product.toLowerCase().includes(query.toLowerCase())
  );

  const billboards = store.getBillboards().filter(b =>
    b.billboardId.toLowerCase().includes(query.toLowerCase()) ||
    b.location.toLowerCase().includes(query.toLowerCase()) ||
    (b.currentProduct && b.currentProduct.toLowerCase().includes(query.toLowerCase()))
  );

  const lcdScreens = store.getLCDScreens().filter(l =>
    l.screenId.toLowerCase().includes(query.toLowerCase()) ||
    l.screenName.toLowerCase().includes(query.toLowerCase()) ||
    l.location.toLowerCase().includes(query.toLowerCase())
  );

  const payments = store.getPayments().filter(p =>
    p.paymentId.toLowerCase().includes(query.toLowerCase()) ||
    p.recipient.toLowerCase().includes(query.toLowerCase()) ||
    p.reference.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = query.trim().length > 0 && (
    influencers.length > 0 ||
    deliveries.length > 0 ||
    billboards.length > 0 ||
    lcdScreens.length > 0 ||
    payments.length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-amber-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across influencers, deliveries, billboards, LCDs, payments..."
            autoFocus
            className="flex-1 bg-transparent border-none text-white text-base focus:outline-none placeholder-slate-500"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 divide-y divide-slate-800/60">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p className="font-medium text-slate-300">Global Operational Search</p>
              <p className="text-xs text-slate-500 mt-1">Type an influencer name, product, billboard ID, or payment reference (e.g., "Dhexyar", "DEL-001", "BB-024")</p>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No matching records found for "<span className="text-white font-semibold">{query}</span>"
            </div>
          ) : (
            <>
              {/* Influencers Results */}
              {influencers.length > 0 && (
                <div className="pt-3 first:pt-0">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Influencers ({influencers.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {influencers.slice(0, 4).map(inf => (
                      <button
                        key={inf.id}
                        onClick={() => {
                          onNavigate({ section: 'Influencers', subSection: 'All Influencers' }, inf.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={inf.profilePhoto} alt={inf.fullName} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                              {inf.fullName}
                            </div>
                            <div className="text-xs text-slate-400">{inf.tiktokUsername || inf.category} • Target: {inf.targetVideosPerMonth} vids/mo</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Records Results */}
              {deliveries.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deliveries ({deliveries.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {deliveries.slice(0, 4).map(del => (
                      <button
                        key={del.id}
                        onClick={() => {
                          onNavigate({ section: 'Influencers', subSection: 'Delivery Records' }, del.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {del.deliveryId} - {del.product}
                          </div>
                          <div className="text-xs text-slate-400">Influencer: {del.influencerName} • ${del.totalPrice} ({del.paymentStatus})</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Billboards Results */}
              {billboards.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Billboards ({billboards.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {billboards.slice(0, 4).map(bb => (
                      <button
                        key={bb.id}
                        onClick={() => {
                          onNavigate({ section: 'Billboards', subSection: 'All Billboards' }, bb.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                            {bb.billboardId} - {bb.location}
                          </div>
                          <div className="text-xs text-slate-400">{bb.size} • {bb.currentProduct || 'No active product'} • ${bb.rentPrice}/mo</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LCD Screens Results */}
              {lcdScreens.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-purple-400" />
                    <span>LCD Screens ({lcdScreens.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {lcdScreens.slice(0, 4).map(lcd => (
                      <button
                        key={lcd.id}
                        onClick={() => {
                          onNavigate({ section: 'LCD Screens', subSection: 'All LCD Screens' }, lcd.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                            {lcd.screenId} - {lcd.screenName}
                          </div>
                          <div className="text-xs text-slate-400">{lcd.location} • {lcd.screenSize} • ${lcd.rentPrice}/mo</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Central Payments Results */}
              {payments.length > 0 && (
                <div className="pt-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Payments ({payments.length})</span>
                  </h3>
                  <div className="space-y-1">
                    {payments.slice(0, 4).map(pay => (
                      <button
                        key={pay.id}
                        onClick={() => {
                          onNavigate({ section: 'Payments', subSection: 'All Payments' }, pay.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {pay.paymentId} ({pay.paymentType}) - ${pay.amount}
                          </div>
                          <div className="text-xs text-slate-400">Recipient: {pay.recipient} • Status: {pay.status}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
