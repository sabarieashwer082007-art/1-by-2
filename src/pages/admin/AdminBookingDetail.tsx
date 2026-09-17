import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Mail,
  MessageSquare,
  Clock,
  Phone,
  Calendar,
  AlertTriangle,
  RotateCw,
  Send,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import { approveBooking, rejectBooking } from '../../services/bookingService';
import { AdminGalleryManager } from '../../components/admin/AdminGalleryManager';

interface AdminBookingDetailProps {
  bookingId: string;
  onNavigate: (page: string) => void;
}

export const AdminBookingDetail: React.FC<AdminBookingDetailProps> = ({ bookingId, onNavigate }) => {
  const { siteSettings, design } = useStudio();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [docId, setDocId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Actions
  const [processing, setProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Date unavailable / Fully booked');

  // Admin notes
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const q = query(collection(db, 'bookings'), where('bookingId', '==', bookingId));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docItem = snap.docs[0];
          setDocId(docItem.id);
          const data = docItem.data() as Booking;
          setBooking(data);
          setAdminNotes(data.adminNotes || '');

          // Live listener for real-time status updates
          const unsub = onSnapshot(docItem.ref, (updatedSnap) => {
            if (updatedSnap.exists()) {
              const updatedData = updatedSnap.data() as Booking;
              setBooking(updatedData);
              setAdminNotes(updatedData.adminNotes || '');
            }
          });
          setLoading(false);
          return () => unsub();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // CRITICAL FLOW: ACCEPT BOOKING
  const handleAcceptBooking = async () => {
    if (!booking || !docId || !user) return;

    if (!window.confirm(`Are you sure you want to approve booking ${booking.bookingId} for ${booking.clientName}? This will trigger customer Email and WhatsApp notifications.`)) {
      return;
    }

    setProcessing(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await approveBooking(docId, booking, { uid: user.uid, email: user.email });
      if (res.success) {
        if (res.emailStatus === 'failed' || res.whatsappStatus === 'failed') {
          setActionSuccessMsg('Booking approved in Firestore! Note: External notification dispatch encountered an issue (check logs below).');
        } else {
          setActionSuccessMsg('Booking approved! Real-time notifications dispatched to client.');
        }
      } else {
        setActionErrorMsg(res.error || 'Failed to approve booking.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'An error occurred during approval.');
    } finally {
      setProcessing(false);
    }
  };

  // REJECT BOOKING
  const handleRejectBooking = async () => {
    if (!booking || !docId || !user) return;

    setProcessing(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await rejectBooking(docId, booking, rejectionReason, { uid: user.uid, email: user.email });
      if (res.success) {
        setShowRejectModal(false);
        setActionSuccessMsg(`Booking status set to Rejected (${rejectionReason}).`);
      } else {
        setActionErrorMsg(res.error || 'Failed to reject booking.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'An error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  // MARK COMPLETED
  const handleMarkCompleted = async () => {
    if (!docId) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'bookings', docId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setActionSuccessMsg('Booking marked as Completed and archived.');
    } catch (err: any) {
      setActionErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // SAVE ADMIN NOTES
  const handleSaveNotes = async () => {
    if (!docId) return;
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, 'bookings', docId), {
        adminNotes: adminNotes.trim(),
        updatedAt: new Date().toISOString(),
      });
      alert('Admin notes saved successfully.');
    } catch (err: any) {
      alert('Failed to save notes: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  // RESEND EMAIL
  const handleResendEmail = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/bookings/dispatch-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking }),
      });
      const data = await res.json();
      if (data.email?.success) {
        setActionSuccessMsg('Client approval email resent successfully.');
      } else {
        setActionErrorMsg(data.email?.error || 'Email dispatch failed. Verify EMAIL_API_KEY in settings.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // RETRY WHATSAPP
  const handleRetryWhatsapp = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/bookings/dispatch-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking }),
      });
      const data = await res.json();
      if (data.whatsapp?.success) {
        setActionSuccessMsg('WhatsApp approval message resent successfully.');
      } else {
        setActionErrorMsg(data.whatsapp?.error || 'WhatsApp dispatch failed. Check Meta Cloud API credentials in settings.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-400">Loading booking record...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold font-heading" style={{ color: design.headingColor }}>
          Booking {bookingId} not found
        </h2>
        <button
          onClick={() => onNavigate('admin-bookings')}
          className="px-4 py-2 text-xs font-semibold uppercase rounded border"
          style={{ borderColor: design.borderColor, color: design.headingColor }}
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div id="admin-booking-detail-page" className="space-y-8 max-w-5xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('admin-bookings')}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Bookings</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Status:</span>
          <span
            className={`text-xs font-bold uppercase px-3 py-1 rounded border ${
              booking.status === 'approved'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : booking.status === 'pending'
                ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
            }`}
          >
            {booking.status}
          </span>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Top Banner with Accept / Reject / Actions */}
      <div
        className="p-6 sm:p-8 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
        style={{
          backgroundColor: design.surfaceColor,
          borderColor: design.borderColor,
        }}
      >
        <div>
          <div className="text-xs uppercase tracking-widest font-semibold text-neutral-400 mb-1">
            Official Booking Dossier
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            {booking.bookingId} — {booking.clientName}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Submitted on {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Core Decision Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {booking.status === 'pending' && (
            <>
              {/* MANDATORY: ACCEPT BOOKING BUTTON */}
              <button
                id="admin-accept-booking-btn"
                onClick={handleAcceptBooking}
                disabled={processing}
                className="px-6 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#22c55e',
                  color: '#0a0d14',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Booking</span>
              </button>

              <button
                id="admin-reject-booking-btn"
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="px-4 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-red-800 text-red-400 hover:bg-red-950/40"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          )}

          {booking.status === 'approved' && (
            <button
              onClick={handleMarkCompleted}
              disabled={processing}
              className="px-5 py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 border hover:bg-white/5"
              style={{ borderColor: design.borderColor, color: design.headingColor }}
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Mark Session Completed</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout: Details & Dispatch Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Patron & Session Info */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className="p-6 rounded-2xl border space-y-6"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <h3 className="text-base font-bold font-heading border-b pb-3" style={{ color: design.headingColor, borderColor: design.borderColor }}>
              Client Information &amp; Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-neutral-400 text-xs block">Client Full Name</span>
                <span className="font-semibold text-white text-base">{booking.clientName}</span>
              </div>
              <div>
                <span className="text-neutral-400 text-xs block">Service Requested</span>
                <span className="font-semibold text-amber-400">{booking.service}</span>
              </div>
              <div>
                <span className="text-neutral-400 text-xs block">Contact Phone / WhatsApp</span>
                <a href={`tel:${booking.clientPhone}`} className="font-semibold text-white hover:underline">
                  {booking.clientPhone}
                </a>
              </div>
              <div>
                <span className="text-neutral-400 text-xs block">Email Address</span>
                <a href={`mailto:${booking.clientEmail}`} className="font-semibold text-neutral-300 hover:underline">
                  {booking.clientEmail}
                </a>
              </div>
              <div>
                <span className="text-neutral-400 text-xs block">Preferred Session Date</span>
                <span className="font-semibold text-white">{booking.preferredDate}</span>
              </div>
              <div>
                <span className="text-neutral-400 text-xs block">Preferred Time Slot</span>
                <span className="font-semibold text-white">{booking.preferredTime}</span>
              </div>
            </div>

            {booking.message && (
              <div className="pt-4 border-t" style={{ borderColor: design.borderColor }}>
                <span className="text-neutral-400 text-xs block mb-1">Patron Notes / Requests</span>
                <p className="p-4 rounded bg-black/40 text-sm text-neutral-300 leading-relaxed border" style={{ borderColor: design.borderColor }}>
                  {booking.message}
                </p>
              </div>
            )}
          </div>

          {/* Admin Internal Notes (Private) */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading" style={{ color: design.headingColor }}>
                Internal Studio Notes (Private to Admin)
              </h3>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: design.buttonColor,
                  color: '#0a0d14',
                }}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Private photographer assignments, gear notes, advance deposits, or special instructions..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-4 py-3 text-xs rounded bg-black/40 border text-white focus:outline-none focus:border-amber-400"
              style={{ borderColor: design.borderColor }}
            />
          </div>
        </div>

        {/* Right Col: Notification Deliveries & Retries */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className="p-6 rounded-2xl border space-y-6"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <h3 className="text-base font-bold font-heading border-b pb-3" style={{ color: design.headingColor, borderColor: design.borderColor }}>
              Notification Dispatch Status
            </h3>

            {/* Email Status Pill */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Customer Email</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    booking.emailStatus === 'sent'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : booking.emailStatus === 'failed'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {booking.emailStatus || 'Pending'}
                </span>
              </div>
              {booking.lastEmailError && (
                <div className="text-[11px] text-red-400 bg-red-950/40 p-2 rounded border border-red-900/60">
                  {booking.lastEmailError}
                </div>
              )}
              {booking.status === 'approved' && (
                <button
                  onClick={handleResendEmail}
                  disabled={processing}
                  className="w-full py-1.5 rounded border text-[11px] font-semibold text-neutral-300 hover:bg-white/5 flex items-center justify-center gap-1.5"
                  style={{ borderColor: design.borderColor }}
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Resend Customer Email</span>
                </button>
              )}
            </div>

            {/* WhatsApp Status Pill */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: design.borderColor }}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Message</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    booking.whatsappStatus === 'sent'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : booking.whatsappStatus === 'failed'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {booking.whatsappStatus || 'Pending'}
                </span>
              </div>
              {booking.lastWhatsappError && (
                <div className="text-[11px] text-red-400 bg-red-950/40 p-2 rounded border border-red-900/60">
                  {booking.lastWhatsappError}
                </div>
              )}
              {booking.status === 'approved' && (
                <button
                  onClick={handleRetryWhatsapp}
                  disabled={processing}
                  className="w-full py-1.5 rounded border text-[11px] font-semibold text-neutral-300 hover:bg-white/5 flex items-center justify-center gap-1.5"
                  style={{ borderColor: design.borderColor }}
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry WhatsApp Message</span>
                </button>
              )}
            </div>

            {/* Client portal link info */}
            <div className="pt-4 border-t text-xs space-y-2 text-neutral-400" style={{ borderColor: design.borderColor }}>
              <div className="font-semibold text-neutral-300">Patron Live Status Link:</div>
              <div className="p-2 rounded bg-black/50 font-mono text-[11px] break-all border" style={{ borderColor: design.borderColor }}>
                /booking/{booking.secureToken}
              </div>

              <button
                type="button"
                onClick={() => onNavigate('admin-notifications')}
                className="w-full mt-2 py-1.5 px-3 rounded text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 flex items-center justify-center gap-1.5 transition"
              >
                <span>View Full Notification Audit Logs</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Private Client Photo Gallery System */}
      <AdminGalleryManager booking={booking} docId={docId} />

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="max-w-md w-full p-6 sm:p-8 rounded-2xl border space-y-6 animate-in zoom-in-95"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <h2 className="text-xl font-bold font-heading text-red-400">
              Reject Booking Request
            </h2>
            <p className="text-xs text-neutral-300">
              Please specify the reason for declining this request. This will update the status in Firestore and notify the patron.
            </p>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                Reason
              </label>
              <input
                type="text"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Schedule already fully committed on this date"
                className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                style={{ borderColor: design.borderColor }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs uppercase font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectBooking}
                disabled={processing}
                className="px-6 py-2 rounded text-xs uppercase font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {processing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
