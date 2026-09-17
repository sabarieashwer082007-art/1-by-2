import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Camera,
  FileText,
  Sliders,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings & Patrons', icon: Calendar },
    { id: 'portfolio', label: 'Portfolio & Media', icon: Camera },
    { id: 'content', label: 'Website CMS', icon: FileText },
    { id: 'design', label: 'Design & Styling', icon: Sliders },
    { id: 'notifications', label: 'Notification Logs', icon: Bell },
    { id: 'settings', label: 'Integrations & Info', icon: SettingsIcon },
  ];

  return (
    <div
      id="admin-portal-layout"
      className="min-h-screen flex flex-col md:flex-row"
      style={{
        backgroundColor: design.backgroundColor,
        color: design.bodyTextColor,
      }}
    >
      {/* Mobile Topbar */}
      <div
        className="md:hidden flex items-center justify-between p-4 border-b"
        style={{
          backgroundColor: design.surfaceColor,
          borderColor: design.borderColor,
        }}
      >
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-400" />
          <span className="font-bold font-heading text-sm" style={{ color: design.headingColor }}>
            1 by 2 Studio Admin
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded text-white"
          aria-label="Toggle admin menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 border-r flex-shrink-0 flex flex-col justify-between`}
        style={{
          backgroundColor: design.surfaceColor,
          borderColor: design.borderColor,
        }}
      >
        <div className="p-6 space-y-8">
          {/* Brand Header */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className="w-9 h-9 rounded flex items-center justify-center border"
              style={{
                backgroundColor: `${design.accentColor}26`,
                borderColor: `${design.accentColor}4d`,
                color: design.accentColor,
              }}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base block font-heading" style={{ color: design.headingColor }}>
                1 by 2 Studio
              </span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-sans">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'shadow'
                      : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? design.accentColor : 'transparent',
                    color: isActive ? '#0a0d14' : design.headingColor,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Tools */}
        <div className="p-6 border-t space-y-4" style={{ borderColor: design.borderColor }}>
          <button
            onClick={onGoToPublic}
            className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px]">↗</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors pt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Workspace */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
