import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  ArrowRight,
  TrendingUp,
  Camera,
  Layers,
  Settings as SettingsIcon,
  Phone,
  FileText,
  UserCheck
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { Booking, NotificationItem } from '../../types';
import { AdminAnalyticsCharts } from '../../components/admin/AdminAnalyticsCharts';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: { bookingId?: string }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { siteSettings, design } = useStudio();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Real-time Bookings Listener
    const unsubBookings = onSnapshot(
      query(collection(db, 'bookings'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        console.error('Bookings listener error:', err);
        setLoading(false);
      }
    );

    // 2. Real-time Notifications Listener (MANDATORY REQUIREMENT: real time updates)
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
        setNotifications(list);
      },
      (err) => console.error('Notifications listener error:', err)
    );

    return () => {
      unsubBookings();
      unsubNotifications();
    };
  }, []);

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.preferredDate === todayStr);

  return (
    <div id="admin-dashboard-container" className="space-y-10">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Studio Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Logged in as <span className="text-neutral-200 font-semibold">{user?.email || 'Administrator'}</span> • {siteSettings.studioName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-bookings')}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            style={{
              backgroundColor: design.buttonColor,
              color: '#0a0d14',
            }}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Manage All Bookings</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* TOTAL */}
        <div
          className="p-6 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: design.surfaceColor, borderColor: design.borderColor }}
        >
          <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
            Total Bookings
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-heading my-2" style={{ color: design.headingColor }}>
            {totalCount}
          </div>
          <div className="text-[11px] text-neutral-400">All lifetime inquiries</div>
        </div>

        {/* PENDING */}
        <div
          className="p-6 rounded-xl border border-blue-900/60 flex flex-col justify-between"
          style={{ backgroundColor: `${design.surfaceColor}` }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-blue-400">
            <span>Pending</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-heading my-2 text-blue-400">
            {pendingCount}
          </div>
          <div className="text-[11px] text-blue-300/80">Requires studio review</div>
        </div>

        {/* APPROVED */}
        <div
          className="p-6 rounded-xl border border-emerald-900/60 flex flex-col justify-between"
          style={{ backgroundColor: `${design.surfaceColor}` }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-emerald-400">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-heading my-2 text-emerald-400">
            {approvedCount}
          </div>
          <div className="text-[11px] text-emerald-300/80">Confirmed bookings</div>
        </div>

        {/* REJECTED */}
        <div
          className="p-6 rounded-xl border border-red-900/60 flex flex-col justify-between"
          style={{ backgroundColor: `${design.surfaceColor}` }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-red-400">
            <span>Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-heading my-2 text-red-400">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-red-300/80">Declined / Rescheduled</div>
        </div>

        {/* COMPLETED */}
        <div
          className="p-6 rounded-xl border flex flex-col justify-between"
          style={{ backgroundColor: design.surfaceColor, borderColor: design.borderColor }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-neutral-400">
            <span>Completed</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-heading my-2 text-amber-400">
            {completedCount}
          </div>
          <div className="text-[11px] text-neutral-400">Vault delivered</div>
        </div>
      </div>

      {/* Recharts Booking Analytics */}
      <AdminAnalyticsCharts bookings={bookings} accentColor={design.accentColor} />

      {/* Main Split: Recent Bookings & Real-Time Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Bookings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading" style={{ color: design.headingColor }}>
              Recent Booking Inquiries
            </h2>
            <button
              onClick={() => onNavigate('admin-bookings')}
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{ color: design.accentColor }}
            >
              <span>View Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-400">
                No bookings recorded yet. New inquiries submitted through the website will appear here in real-time.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: design.borderColor }}>
                {bookings.slice(0, 6).map((b) => (
                  <div
                    key={b.bookingId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onNavigate('admin-booking-detail', { bookingId: b.bookingId })}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{b.bookingId}</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                            b.status === 'approved'
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                              : b.status === 'pending'
                              ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                              : 'bg-red-950/60 border-red-800 text-red-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="font-semibold text-sm" style={{ color: design.headingColor }}>
                        {b.clientName} — <span className="text-neutral-400 font-normal">{b.service}</span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-4">
                        <span>Date: {b.preferredDate} ({b.preferredTime})</span>
                        <span>Phone: {b.clientPhone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded border flex items-center gap-1 hover:bg-white/10" style={{ borderColor: design.borderColor, color: design.headingColor }}>
                        <span>Open Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Real-time Live Notifications */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading flex items-center gap-2" style={{ color: design.headingColor }}>
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Real-Time Alerts</span>
            </h2>
            <span className="text-[11px] text-neutral-500 uppercase tracking-widest">Live Sync</span>
          </div>

          <div
            className="p-5 rounded-xl border space-y-3"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, idx) => (
                  <div
                    key={notif.id || idx}
                    className="p-3 rounded-lg border text-xs space-y-1 hover:bg-white/5 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: `${design.primaryColor}80`,
                      borderColor: design.borderColor,
                    }}
                    onClick={() => {
                      if (notif.bookingId) {
                        onNavigate('admin-booking-detail', { bookingId: notif.bookingId });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">{notif.title}</span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-300">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Studio Links */}
          <div
            className="p-5 rounded-xl border space-y-3"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
              Quick Admin Actions
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('admin-portfolio')}
                className="p-2.5 rounded border text-left flex items-center gap-2 hover:bg-white/5"
                style={{ borderColor: design.borderColor, color: design.headingColor }}
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Portfolio</span>
              </button>
              <button
                onClick={() => onNavigate('admin-content')}
                className="p-2.5 rounded border text-left flex items-center gap-2 hover:bg-white/5"
                style={{ borderColor: design.borderColor, color: design.headingColor }}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit CMS</span>
              </button>
              <button
                onClick={() => onNavigate('admin-design')}
                className="p-2.5 rounded border text-left flex items-center gap-2 hover:bg-white/5"
                style={{ borderColor: design.borderColor, color: design.headingColor }}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Colors &amp; Fonts</span>
              </button>
              <button
                onClick={() => onNavigate('admin-settings')}
                className="p-2.5 rounded border text-left flex items-center gap-2 hover:bg-white/5"
                style={{ borderColor: design.borderColor, color: design.headingColor }}
              >
                <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Integrations</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
