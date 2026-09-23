import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCw,
  Send,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useToast } from '../../context/ToastContext';

export interface NotificationLog {
  id: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  bookingId?: string;
  type: string;
  status: 'sent' | 'failed' | 'not_configured' | 'pending';
  providerMessageId?: string | null;
  createdAt: string;
  sentAt?: string | null;
  error?: string;
  retryCount?: number;
}

export const AdminNotifications: React.FC = () => {
  const { design } = useStudio();
  const { showSuccess, showError, showInfo } = useToast();

  const [emailLogs, setEmailLogs] = useState<NotificationLog[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Active channel view
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // 1. Subscribe to emailLogs
    const unsubEmail = onSnapshot(
      query(collection(db, 'emailLogs'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          channel: 'email' as const,
          ...d.data(),
        })) as NotificationLog[];
        setEmailLogs(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading emailLogs:', err);
        setLoading(false);
      }
    );

    // 2. Subscribe to whatsappLogs
    const unsubWhatsapp = onSnapshot(
      query(collection(db, 'whatsappLogs'), orderBy('createdAt', 'desc')),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            channel: 'whatsapp' as const,
            recipient: data.phone || data.recipient || 'N/A',
            bookingId: data.bookingId,
            type: data.type || 'booking_notification',
            status: data.status || 'not_configured',
            providerMessageId: data.providerMessageId || null,
            createdAt: data.createdAt || new Date().toISOString(),
            sentAt: data.sentAt,
            error: data.error,
            retryCount: data.retryCount || 0,
          } as NotificationLog;
        });
        setWhatsappLogs(list);
      },
      (err) => {
        console.error('Error loading whatsappLogs:', err);
      }
    );

    return () => {
      unsubEmail();
      unsubWhatsapp();
    };
  }, []);

  // Combined logs sorted by timestamp descending
  const combinedLogs = useMemo(() => {
    let combined: NotificationLog[] = [];
    if (channelFilter === 'all' || channelFilter === 'email') {
      combined = [...combined, ...emailLogs];
    }
    if (channelFilter === 'all' || channelFilter === 'whatsapp') {
      combined = [...combined, ...whatsappLogs];
    }
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [emailLogs, whatsappLogs, channelFilter]);

  // Filter pipeline
  const filteredLogs = useMemo(() => {
    return combinedLogs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (typeFilter !== 'all' && log.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRecip = log.recipient?.toLowerCase().includes(q);
        const matchRef = log.bookingId?.toLowerCase().includes(q);
        const matchType = log.type?.toLowerCase().includes(q);
        if (!matchRecip && !matchRef && !matchType) return false;
      }
      return true;
    });
  }, [combinedLogs, statusFilter, typeFilter, searchQuery]);

  // Retry notification handler
  const handleRetry = async (log: NotificationLog) => {
    setRetryingId(log.id);
    showInfo(`Attempting retry for ${log.channel.toUpperCase()} to ${log.recipient}...`);

    try {
      const res = await fetch('/api/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: log.channel,
          recipient: log.recipient,
          bookingId: log.bookingId,
          notificationType: log.type,
        }),
      });

      const data = await res.json();
      const collName = log.channel === 'email' ? 'emailLogs' : 'whatsappLogs';

      if (data.status === 'not_configured') {
        showError(`Provider for ${log.channel.toUpperCase()} is NOT CONFIGURED in environment variables.`);
        await updateDoc(doc(db, collName, log.id), {
          retryCount: increment(1),
          status: 'not_configured',
          error: `${log.channel.toUpperCase()} service is not configured.`,
        });
      } else if (data.success || data.status === 'sent') {
        showSuccess(`${log.channel.toUpperCase()} re-dispatched successfully!`);
        await updateDoc(doc(db, collName, log.id), {
          status: 'sent',
          sentAt: new Date().toISOString(),
          error: '',
          retryCount: increment(1),
          providerMessageId: data.providerMessageId || data.id || null,
        });
      } else {
        showError(data.error || `Retry failed for ${log.channel}`);
        await updateDoc(doc(db, collName, log.id), {
          status: 'failed',
          retryCount: increment(1),
          error: data.error || 'Retry delivery failed',
        });
      }
    } catch (err: any) {
      showError(err.message || 'Error executing retry');
    } finally {
      setRetryingId(null);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      sent: combinedLogs.filter((l) => l.status === 'sent').length,
      failed: combinedLogs.filter((l) => l.status === 'failed').length,
      not_configured: combinedLogs.filter((l) => l.status === 'not_configured').length,
    };
  }, [combinedLogs]);

  return (
    <div id="admin-notifications-page" className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Notification Logs &amp; Delivery Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time delivery audits, recipient timestamps, provider message IDs, and one-click failure retries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-semibold">
            {statusCounts.sent} Sent
          </span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-semibold">
            {statusCounts.failed} Failed
          </span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 font-semibold">
            {statusCounts.not_configured} Not Configured
          </span>
        </div>
      </div>

      {/* Filter Matrix */}
      <div
        className="p-5 rounded-xl border space-y-4 shadow-xl"
        style={{
          backgroundColor: design.surfaceColor,
          borderColor: design.borderColor,
        }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Audit Query Filters</span>
          </span>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredLogs.length}</strong> of {combinedLogs.length} records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search recipient, booking ID, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
              style={{ borderColor: design.borderColor }}
            />
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={channelFilter}
              onChange={(e: any) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
              style={{ borderColor: design.borderColor }}
            >
              <option value="all">Channel: All (Email &amp; WhatsApp)</option>
              <option value="email">Channel: Email Only</option>
              <option value="whatsapp">Channel: WhatsApp Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
              style={{ borderColor: design.borderColor }}
            >
              <option value="all">Status: All Statuses</option>
              <option value="sent">Status: Sent</option>
              <option value="failed">Status: Failed</option>
              <option value="not_configured">Status: Not Configured</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border text-white focus:outline-none focus:border-amber-400"
              style={{ borderColor: design.borderColor }}
            >
              <option value="all">Type: All Event Types</option>
              <option value="new_booking">New Booking Notification</option>
              <option value="booking_approved">Booking Approved</option>
              <option value="booking_rejected">Booking Rejected</option>
              <option value="gallery_link">Gallery Link</option>
              <option value="test">Integration Test</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div
        className="rounded-xl border overflow-hidden shadow-xl"
        style={{
          backgroundColor: design.surfaceColor,
          borderColor: design.borderColor,
        }}
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 animate-pulse">
            Loading notification delivery logs from Firestore...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
            <p className="font-semibold text-neutral-300">No notification logs match your query.</p>
            <p>Notifications will automatically record here whenever bookings are received, accepted, or galleries are sent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className="border-b text-neutral-400 uppercase tracking-wider font-semibold text-[11px]"
                  style={{
                    backgroundColor: `${design.primaryColor}90`,
                    borderColor: design.borderColor,
                  }}
                >
                  <th className="py-3.5 px-4">Channel &amp; Type</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Status &amp; Provider ID</th>
                  <th className="py-3.5 px-4">Timestamp &amp; Retries</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-neutral-200" style={{ borderColor: design.borderColor }}>
                {filteredLogs.map((log) => (
                  <tr key={`${log.channel}_${log.id}`} className="hover:bg-white/5 transition-colors">
                    {/* Channel & Type */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.channel === 'email' ? (
                          <span className="p-1.5 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-300" title="Email Channel">
                            <Mail className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300" title="WhatsApp Channel">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-white uppercase text-[11px] tracking-wide">
                            {log.channel}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {log.type.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Recipient */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-xs">
                      <span className="text-amber-300/90">{log.recipient}</span>
                    </td>

                    {/* Booking ID */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-xs">
                      {log.bookingId ? (
                        <span className="font-bold text-neutral-200">{log.bookingId}</span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>

                    {/* Status & Error */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'sent'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : log.status === 'failed'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {log.status === 'not_configured' ? 'NOT CONFIGURED' : log.status}
                        </span>

                        {log.providerMessageId && (
                          <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[120px]" title={log.providerMessageId}>
                            id: {log.providerMessageId}
                          </span>
                        )}
                      </div>

                      {log.error && (
                        <p className="text-[11px] text-rose-400 font-sans break-words bg-rose-950/30 p-1.5 rounded border border-rose-900/40">
                          {log.error}
                        </p>
                      )}
                    </td>

                    {/* Timestamp & Retries */}
                    <td className="py-4 px-4 whitespace-nowrap text-[11px] text-neutral-400">
                      <div>
                        {new Date(log.createdAt).toLocaleDateString()} at{' '}
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Retries attempted: <strong className="text-neutral-300">{log.retryCount || 0}</strong>
                      </div>
                    </td>

                    {/* Action: Retry button */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={retryingId === log.id}
                        onClick={() => handleRetry(log)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                          log.status === 'failed' || log.status === 'not_configured'
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                      >
                        <RotateCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                        <span>{retryingId === log.id ? 'Retrying...' : 'Retry Dispatch'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
