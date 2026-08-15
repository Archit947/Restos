import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { RestaurantListPage } from '@/features/restaurants/RestaurantListPage';
import { WebsiteListPage } from '@/features/websites/WebsiteListPage';
import { TemplateListPage } from '@/features/templates/TemplateListPage';
import { AuditLogPage } from '@/features/audit/AuditLogPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AffiliateAdsPage } from '@/features/affiliate/AffiliateAdsPage';

// Wizard
import { CreateRestaurantWizard } from '@/features/restaurants/CreateRestaurantWizard';
import { RestaurantDetailPage } from '@/features/restaurants/RestaurantDetailPage';

// Store
import { useAuthStore } from '@/store/authStore';

// ── Restaurant Admin ──────────────────────────────────────────────────────────
import RestaurantLayout from '@/components/restaurant-layout/RestaurantLayout';
import RestaurantLoginPage from '@/features/restaurant/login/RestaurantLoginPage';
import RDashboardPage from '@/features/restaurant/dashboard/RDashboardPage';
import ROrdersPage from '@/features/restaurant/orders/ROrdersPage';
import MenuCatalogPage from '@/features/restaurant/menu/MenuCatalogPage';
import WebsiteCMSPage from '@/features/restaurant/cms/WebsiteCMSPage';
import POSPage from '@/features/restaurant/pos/POSPage';
import InvoicingPage from '@/features/restaurant/invoicing/InvoicingPage';
import TablePortalPage from '@/features/restaurant/tables/TablePortalPage';
import TableOrderPortal from '@/features/restaurant/tables/TableOrderPortal';
import CustomersPage from '@/features/restaurant/customers/CustomersPage';
import AnalyticsPage from '@/features/restaurant/analytics/AnalyticsPage';
import RSettingsPage from '@/features/restaurant/settings/RSettingsPage';

// ── Public site (restaurant websites) ────────────────────────────────────────
import SiteApp from '@/features/site/SiteApp';

// ── Kitchen KDS ───────────────────────────────────────────────────────────────
import KdsApp from '@/features/kds/KdsApp';

// ── Store Portal ──────────────────────────────────────────────────────────────
import StoreLoginPage     from '@/features/store/login/StoreLoginPage';
import StoreLayout        from '@/features/store/StoreLayout';
import StoreDashboardPage from '@/features/store/dashboard/StoreDashboardPage';
import StoreItemsPage     from '@/features/store/items/StoreItemsPage';
import StoreOrdersPage    from '@/features/store/orders/StoreOrdersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper for restaurant list with wizard state
function RestaurantListWithWizard() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isNewPage, setIsNewPage] = useState(false);
  const { pathname } = window.location;

  // If route is /restaurants/new, open the wizard
  React.useEffect(() => {
    if (pathname === '/restaurants/new') {
      setWizardOpen(true);
    }
  }, [pathname]);

  return (
    <>
      <RestaurantListPage />
      <CreateRestaurantWizard
        open={wizardOpen || isNewPage}
        onClose={() => {
          setWizardOpen(false);
          setIsNewPage(false);
          window.history.pushState({}, '', '/restaurants');
        }}
      />
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected admin routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="restaurants" element={<RestaurantListWithWizard />} />
            <Route path="restaurants/new" element={<RestaurantListWithWizard />} />
            <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
            <Route path="websites" element={<WebsiteListPage />} />
            <Route path="templates" element={<TemplateListPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
            <Route path="settings"      element={<SettingsPage />} />
            <Route path="affiliate-ads" element={<AffiliateAdsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* ── Restaurant Admin routes ── */}
          <Route path="/restaurant/login" element={<RestaurantLoginPage />} />
          {/* Standalone tablet portal — no sidebar */}
          <Route path="/restaurant/tportal" element={<TableOrderPortal />} />
          <Route path="/restaurant" element={<RestaurantLayout />}>
            <Route index element={<Navigate to="/restaurant/dashboard" replace />} />
            <Route path="dashboard"  element={<RDashboardPage />} />
            <Route path="orders"     element={<ROrdersPage />} />
            <Route path="tables"     element={<TablePortalPage />} />
            <Route path="menu"       element={<MenuCatalogPage />} />
            <Route path="cms"        element={<WebsiteCMSPage />} />
            <Route path="pos"        element={<POSPage />} />
            <Route path="invoicing"  element={<InvoicingPage />} />
            <Route path="customers"  element={<CustomersPage />} />
            <Route path="analytics"  element={<AnalyticsPage />} />
            <Route path="settings"   element={<RSettingsPage />} />
          </Route>

          {/* ── Public restaurant sites ── */}
          <Route path="/s/*" element={<SiteApp />} />

          {/* ── Kitchen KDS portal ── */}
          <Route path="/kds/*" element={<KdsApp />} />

          {/* ── Store Admin portal ── */}
          <Route path="/store/login" element={<StoreLoginPage />} />
          <Route path="/store" element={<StoreLayout />}>
            <Route index element={<Navigate to="/store/dashboard" replace />} />
            <Route path="dashboard" element={<StoreDashboardPage />} />
            <Route path="items"     element={<StoreItemsPage />} />
            <Route path="orders"    element={<StoreOrdersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e2330',
            color: '#f1f5f9',
            borderRadius: '12px',
            fontSize: '13px',
            padding: '12px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
