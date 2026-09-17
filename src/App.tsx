import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudioProvider } from './context/StudioContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { Portfolio } from './pages/Portfolio';
import { Reviews } from './pages/Reviews';
import { Contact } from './pages/Contact';
import { BookingPage } from './pages/BookingPage';
import { CustomerBookingStatus } from './pages/CustomerBookingStatus';
import { ClientGallery } from './pages/ClientGallery';

// Admin pages
import { AdminLogin } from './pages/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminBookingDetail } from './pages/admin/AdminBookingDetail';
import { AdminPortfolio } from './pages/admin/AdminPortfolio';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminDesignSettings } from './pages/admin/AdminDesignSettings';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminNotifications } from './pages/admin/AdminNotifications';

function AppContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Route state
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  const [intendedAdminRoute, setIntendedAdminRoute] = useState<string | null>(null);

  // Sync initial URL path if opened directly (e.g. /admin/bookings/1B2-2026-00001, /booking/token, or /gallery/token)
  useEffect(() => {
    const path = window.location.pathname;

    if (path.startsWith('/admin/bookings/')) {
      const bId = path.split('/admin/bookings/')[1];
      if (bId) {
        if (!user || !isAdmin) {
          setIntendedAdminRoute(path);
          setCurrentPage('admin-login');
        } else {
          setRouteParams({ bookingId: bId });
          setCurrentPage('admin-booking-detail');
        }
      }
    } else if (path === '/admin' || path.startsWith('/admin')) {
      if (!user || !isAdmin) {
        setIntendedAdminRoute(path);
        setCurrentPage('admin-login');
      } else {
        setCurrentPage('admin-dashboard');
      }
    } else if (path.startsWith('/booking/')) {
      const token = path.split('/booking/')[1];
      if (token) {
        setRouteParams({ token });
        setCurrentPage('booking-status');
      }
    } else if (path.startsWith('/gallery/')) {
      const token = path.split('/gallery/')[1];
      if (token) {
        setRouteParams({ token });
        setCurrentPage('client-gallery');
      }
    }
  }, [user, isAdmin]);

  const handleNavigate = (page: string, params?: Record<string, any>) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle deep navigation to admin routes with redirect preservation
    if (page.startsWith('admin-') && page !== 'admin-login') {
      if (!user || !isAdmin) {
        setIntendedAdminRoute(page);
        setCurrentPage('admin-login');
        return;
      }
    }

    if (params) {
      setRouteParams(params);
    }
    setCurrentPage(page);
  };

  // MANDATORY REQUIREMENT: If administrator was redirected to /admin/login from an email link:
  // After successful login: Automatically redirect the admin to the exact booking that was originally requested.
  // Do NOT redirect them only to the dashboard.
  const handleLoginSuccess = () => {
    if (intendedAdminRoute) {
      if (intendedAdminRoute.startsWith('/admin/bookings/')) {
        const bId = intendedAdminRoute.split('/admin/bookings/')[1];
        setRouteParams({ bookingId: bId });
        setCurrentPage('admin-booking-detail');
      } else if (intendedAdminRoute === 'admin-booking-detail' && routeParams.bookingId) {
        setCurrentPage('admin-booking-detail');
      } else {
        setCurrentPage('admin-dashboard');
      }
      setIntendedAdminRoute(null);
    } else {
      setCurrentPage('admin-dashboard');
    }
  };

  // Check if current view is inside Admin portal
  const isAdminView = [
    'admin-dashboard',
    'admin-bookings',
    'admin-booking-detail',
    'admin-portfolio',
    'admin-content',
    'admin-design',
    'admin-notifications',
    'admin-settings',
  ].includes(currentPage);

  if (isAdminView) {
    if (!user || !isAdmin) {
      return (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onNavigate={(p) => handleNavigate(p)}
        />
      );
    }

    // Map currentPage to admin tab ID
    const tabMap: Record<string, string> = {
      'admin-dashboard': 'dashboard',
      'admin-bookings': 'bookings',
      'admin-booking-detail': 'bookings',
      'admin-portfolio': 'portfolio',
      'admin-content': 'content',
      'admin-design': 'design',
      'admin-notifications': 'notifications',
      'admin-settings': 'settings',
    };

    return (
      <AdminLayout
        currentTab={tabMap[currentPage] || 'dashboard'}
        onNavigate={(tab) => {
          const pageMap: Record<string, string> = {
            dashboard: 'admin-dashboard',
            bookings: 'admin-bookings',
            portfolio: 'admin-portfolio',
            content: 'admin-content',
            design: 'admin-design',
            notifications: 'admin-notifications',
            settings: 'admin-settings',
          };
          handleNavigate(pageMap[tab] || 'admin-dashboard');
        }}
        onGoToPublic={() => handleNavigate('home')}
      >
        {currentPage === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
        {currentPage === 'admin-bookings' && <AdminBookings onNavigate={handleNavigate} />}
        {currentPage === 'admin-booking-detail' && (
          <AdminBookingDetail
            bookingId={routeParams.bookingId || ''}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'admin-portfolio' && <AdminPortfolio />}
        {currentPage === 'admin-content' && <AdminContent />}
        {currentPage === 'admin-design' && <AdminDesignSettings />}
        {currentPage === 'admin-notifications' && <AdminNotifications />}
        {currentPage === 'admin-settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Public Header Navbar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Public Main Body */}
      <main className="flex-1">
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'about' && <About onNavigate={handleNavigate} />}
        {currentPage === 'services' && <Services onNavigate={handleNavigate} />}
        {currentPage === 'portfolio' && <Portfolio />}
        {currentPage === 'reviews' && <Reviews />}
        {currentPage === 'contact' && <Contact />}
        {currentPage === 'booking' && (
          <BookingPage
            initialService={routeParams.service}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'booking-status' && (
          <CustomerBookingStatus
            tokenOrId={routeParams.token || routeParams.bookingId || ''}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'client-gallery' && (
          <ClientGallery
            token={routeParams.token || ''}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Public Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudioProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </StudioProvider>
    </AuthProvider>
  );
}
