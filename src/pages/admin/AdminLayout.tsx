import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Camera,
  Image as ImageIcon,
  Sparkles,
  MessageSquare,
  FileText,
  Sliders,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudio } from '../../context/StudioContext';

interface AdminLayoutProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onGoToPublic: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onNavigate,
  onGoToPublic,
  children,
}) => {
  const { user, logout } = useAuth();
  const { siteSettings, design } = useStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact requested Left Sidebar tabs
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'portfolio', label: 'Portfolio', icon: Camera },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: Sparkles },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'content', label: 'Website Content', icon: FileText },
    { id: 'design', label: 'Styles & Design', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Operations Dashboard',
      subtitle: 'Real-time booking telemetry, inquiries, and calendar metrics.',
    },
    bookings: {
      title: 'Patron Booking Coordination',
      subtitle: 'Manage client dates, approve sessions, issue confirmation links.',
    },
    portfolio: {
      title: 'Curated Portfolio Works',
      subtitle: 'Editorial commissions, client showcases, and category curation.',
    },
    media: {
      title: 'Media & Imagery Library',
      subtitle: 'Global studio imagery repository, image replacement, and asset slots.',
    },
    services: {
      title: 'Disciplines & Commissions',
      subtitle: 'Packages, rates, deliverables, and service offerings.',
    },
    testimonials: {
      title: 'Client Praise & Testimonials',
      subtitle: 'Review approvals, editorial testimonials, and patron feedback.',
    },
    content: {
      title: 'Website Copy & CMS',
      subtitle: 'Headlines, philosophy, studio story, and hero statements.',
    },
    design: {
      title: 'Styles & Visual Architecture',
      subtitle: 'Palette configuration, typography hierarchy, and theme tokens.',
    },
    settings: {
      title: 'Integrations & System Settings',
      subtitle: 'Firebase, WhatsApp Business API, and Resend email credentials.',
    },
  };

  const currentHeader = pageTitles[currentTab] || {
    title: 'Studio Management',
    subtitle: 'Confidential atelier administration console.',
  };

  return (
    <div
      id="admin-portal-layout"
      className="min-h-screen flex flex-col md:flex-row bg-[#F4F1EC] text-[#1C1C1A] font-sans"
    >
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 border-b border-[#D8D2C8] bg-[#FFFFFF]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] flex items-center justify-center bg-[#E8E3DB] border border-[#D8D2C8] text-[#6B4F3A]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-bold text-sm text-[#1C1C1A] block">
              1 by 2 Studio
            </span>
            <span className="text-[10px] text-[#66645F] uppercase tracking-wider block font-mono">
              Admin Portal
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-[4px] border border-[#D8D2C8] text-[#1C1C1A]"
          aria-label="Toggle admin menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 border-r border-[#D8D2C8] bg-[#FFFFFF] flex-shrink-0 flex flex-col justify-between z-20`}
      >
        <div className="p-5 space-y-6">
          {/* Brand Header */}
          <div className="hidden md:flex items-center gap-3 pb-4 border-b border-[#D8D2C8]">
            <div className="w-9 h-9 rounded-[4px] flex items-center justify-center bg-[#E8E3DB] border border-[#D8D2C8] text-[#6B4F3A] shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="font-heading font-bold text-base text-[#1C1C1A] block truncate">
                1 by 2 Studio
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#66645F] block font-mono">
                Atelier Admin
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1C1C1A] text-[#F4F1EC] shadow-xs'
                      : 'text-[#66645F] hover:text-[#1C1C1A] hover:bg-[#F4F1EC]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A47C5B]' : 'text-[#66645F]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Tools */}
        <div className="p-5 border-t border-[#D8D2C8] bg-[#F4F1EC]/50 space-y-3">
          <div className="px-2 py-1.5 rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] font-mono text-[#1C1C1A] truncate" title={user?.email || 'Admin'}>
              {user?.email || 'Authorized Admin'}
            </span>
          </div>

          <button
            onClick={onGoToPublic}
            className="w-full flex items-center justify-between text-xs text-[#66645F] hover:text-[#1C1C1A] transition-colors px-2 py-1 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px]">↗</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-xs text-rose-700 hover:text-rose-800 transition-colors px-2 py-1 cursor-pointer font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE: TOP BAR + MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header className="border-b border-[#D8D2C8] bg-[#FFFFFF] px-6 sm:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#1C1C1A] leading-tight">
              {currentHeader.title}
            </h2>
            <p className="text-xs text-[#66645F] font-sans mt-0.5">
              {currentHeader.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Admin Account Status Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B4F3A]" />
              <span className="text-[#66645F] text-[11px]">Admin:</span>
              <span className="font-mono text-[#1C1C1A] font-semibold text-[11px]">
                {user?.email ? user.email.split('@')[0] : 'admin'}
              </span>
            </div>

            <button
              onClick={onGoToPublic}
              className="px-3 py-1.5 rounded-[4px] border border-[#D8D2C8] bg-[#FFFFFF] hover:bg-[#F4F1EC] text-xs font-semibold uppercase tracking-wider text-[#1C1C1A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">View Site</span>
            </button>

            <button
              onClick={logout}
              className="p-1.5 rounded-[4px] border border-[#D8D2C8] text-[#66645F] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
