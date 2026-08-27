import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { NavSelection, Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { LoginScreen } from './components/auth/LoginScreen';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AlertsDrawer } from './components/common/AlertsDrawer';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { InfluencersView } from './components/influencers/InfluencersView';
import { TargetTrackingView } from './components/influencers/TargetTrackingView';
import { DeliveryRecordsView } from './components/influencers/DeliveryRecordsView';
import { InfluencerPaymentsView } from './components/influencers/InfluencerPaymentsView';
import { BillboardsView } from './components/billboards/BillboardsView';
import { BillboardPaymentsView } from './components/billboards/BillboardPaymentsView';
import { LCDScreensView } from './components/lcd/LCDScreensView';
import { LCDVideosView } from './components/lcd/LCDVideosView';
import { LCDPaymentsView } from './components/lcd/LCDPaymentsView';
import { LocalBudgetView } from './components/budget/LocalBudgetView';
import { InternationalBudgetView } from './components/budget/InternationalBudgetView';
import { ExpensesView } from './components/budget/ExpensesView';
import { PaymentsMasterView } from './components/payments/PaymentsMasterView';
import { ReportsMasterView } from './components/reports/ReportsMasterView';
import { UsersView } from './components/settings/UsersView';
import { AuditLogsView } from './components/settings/AuditLogsView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(store.getCurrentUser());

  const [navSelection, setNavSelection] = useState<NavSelection>({
    section: 'Dashboard'
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Force re-render state hook for store state updates
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setTick(t => t + 1);
      const user = store.getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(!!user && !!user.id && user.status === 'active');
    });
    // Check initial auth state
    const initialUser = store.getCurrentUser();
    setIsAuthenticated(!!initialUser && !!initialUser.id && initialUser.status === 'active');
    return unsub;
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentUser(store.getCurrentUser());
    setNavSelection({ section: 'Dashboard' });
  };

  const handleLogout = () => {
    store.logout();
    setIsAuthenticated(false);
  };

  const renderCurrentView = () => {
    const { section, subSection } = navSelection;

    if (section === 'Dashboard') {
      return <DashboardView onNavigate={setNavSelection} />;
    }

    if (section === 'Influencers') {
      if (subSection === 'Target Tracking') return <TargetTrackingView />;
      if (subSection === 'Delivery Records') return <DeliveryRecordsView />;
      if (subSection === 'Payments') return <InfluencerPaymentsView />;
      return <InfluencersView />;
    }

    if (section === 'Billboards') {
      if (subSection === 'Payments') return <BillboardPaymentsView />;
      return <BillboardsView />;
    }

    if (section === 'LCD Screens') {
      if (subSection === 'Payments') return <LCDPaymentsView />;
      return <LCDScreensView />;
    }

    if (section === 'Budget') {
      if (subSection === 'International') return <InternationalBudgetView />;
      if (subSection === 'Expenses') return <ExpensesView />;
      return <LocalBudgetView />;
    }

    if (section === 'Payments') {
      if (subSection === 'Pending') return <PaymentsMasterView initialFilter="Pending" />;
      if (subSection === 'Approved') return <PaymentsMasterView initialFilter="Approved" />;
      if (subSection === 'Paid') return <PaymentsMasterView initialFilter="Paid" />;
      return <PaymentsMasterView initialFilter="All" />;
    }

    if (section === 'Reports') {
      return <ReportsMasterView />;
    }

    if (section === 'Settings') {
      if (subSection === 'Audit Logs') return <AuditLogsView />;
      return <UsersView />;
    }

    return <DashboardView onNavigate={setNavSelection} />;
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeNavTitle={
          navSelection.subSection
            ? `${navSelection.section} - ${navSelection.subSection}`
            : navSelection.section
        }
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenAuditLogs={() => setNavSelection({ section: 'Settings', subSection: 'Audit Logs' })}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        toggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentNav={navSelection}
          onSelectNav={setNavSelection}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Operational View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Global Command Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setNavSelection}
      />

      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onNavigate={setNavSelection}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
