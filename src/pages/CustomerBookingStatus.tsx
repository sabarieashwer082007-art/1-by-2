import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStudio } from '../context/StudioContext';
import { Booking } from '../types';
import { CheckCircle2, Clock, XCircle, Phone, Calendar, Mail, User, ArrowLeft } from 'lucide-react';

interface CustomerBookingStatusProps {
  tokenOrId: string;
  onNavigate: (page: string) => void;
}

export const CustomerBookingStatus: React.FC<CustomerBookingStatusProps> = ({ tokenOrId, onNavigate }) => {
  const { siteSettings } = useStudio();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!tokenOrId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let unsub: (() => void) | null = null;

    const findBooking = async () => {
      try {
        let q = query(collection(db, 'bookings'), where('secureToken', '==', tokenOrId));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(collection(db, 'bookings'), where('bookingId', '==', tokenOrId));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const docItem = snap.docs[0];
          setBooking(docItem.data() as Booking);

          unsub = onSnapshot(
            docItem.ref,
            (updatedSnap) => {
              if (updatedSnap.exists()) {
                setBooking(updatedSnap.data() as Booking);
              }
            },
            (err) => {
              console.error('Booking status listener error:', err);
            }
          );
          setLoading(false);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
        setLoading(false);
      }
    };

    findBooking();

    return () => {
      if (unsub) unsub();
    };
  }, [tokenOrId]);

  if (loading) {
    return (
      <div className="bg-[#F4F1EC] min-h-screen py-24 text-center space-y-4 font-sans text-[#1C1C1A]">
        <div className="w-8 h-8 border-2 border-[#6B4F3A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#66645F]">Retrieving your session status...</p>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="bg-[#F4F1EC] min-h-screen py-20 px-4 text-center space-y-6 font-sans text-[#1C1C1A]">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-700">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="font-heading text-3xl font-light text-[#1C1C1A]">
          Booking Record Not Found
        </h2>
        <p className="text-sm text-[#66645F] max-w-md mx-auto">
          We could not locate this reservation record. Please check the link from your confirmation dispatch or reach out to our Chennai studio.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] border border-[#1C1C1A] text-[#1C1C1A] hover:bg-[#1C1C1A] hover:text-[#F4F1EC] transition-colors"
          >
            Back to Studio Home
          </button>
        </div>
      </div>
    );
  }

  const isApproved = booking.status === 'approved';
  const isPending = booking.status === 'pending';

  return (
    <div id="customer-booking-status-page" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 space-y-8 font-sans">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#6B4F3A]">
              1 BY 2 STUDIO PATRON REGISTRY
            </span>
            <span className="w-6 h-[1px] bg-[#6B4F3A]" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-light text-[#1C1C1A]">
            Reservation Status
          </h1>
        </div>

        {/* Main Status Card */}
        <div className="p-8 sm:p-10 rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] space-y-8 shadow-sm">
          {/* Status Indicator Banner */}
          <div
            className={`p-6 rounded-[4px] border flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left ${
              isApproved
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isPending
                ? 'bg-[#E8E3DB]/60 border-[#D8D2C8] text-[#1C1C1A]'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isApproved && <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0" />}
            {isPending && <Clock className="w-8 h-8 text-[#6B4F3A] shrink-0" />}
            {!isApproved && !isPending && <XCircle className="w-8 h-8 text-rose-700 shrink-0" />}

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-widest font-semibold text-[#66645F]">
                Current Coordination State
              </div>
              <div className="text-xl sm:text-2xl font-heading font-normal">
                {isApproved && 'Your session is confirmed!'}
                {isPending && 'Your request is currently being reviewed.'}
                {!isApproved && !isPending && 'Your session request could not be accommodated.'}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#66645F] uppercase tracking-wider font-semibold">
                <Calendar className="w-4 h-4 text-[#6B4F3A]" />
                <span>Shoot Logistics</span>
              </div>
              <div className="font-heading text-xl text-[#1C1C1A]">{booking.service}</div>
              <div className="text-sm text-[#66645F] font-medium">
                {booking.preferredDate} ({booking.preferredTime})
              </div>
            </div>

            <div className="p-5 rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#66645F] uppercase tracking-wider font-semibold">
                <User className="w-4 h-4 text-[#6B4F3A]" />
                <span>Patron Reference</span>
              </div>
              <div className="font-heading text-xl text-[#1C1C1A]">{booking.clientName}</div>
              <div className="text-xs font-mono text-[#66645F]">
                Booking ID: {booking.bookingId}
              </div>
            </div>
          </div>

          {booking.message && (
            <div className="p-5 rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] space-y-1">
              <span className="text-xs uppercase tracking-wider text-[#66645F] font-semibold block">
                Session Vision Notes
              </span>
              <p className="text-sm text-[#1C1C1A] leading-relaxed italic">
                "{booking.message}"
              </p>
            </div>
          )}

          {/* Contact Studio */}
          <div className="pt-4 border-t border-[#D8D2C8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-semibold text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio</span>
            </button>

            <a
              href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2 text-xs text-[#66645F] hover:text-[#1C1C1A] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#6B4F3A]" />
              <span>Questions? Call {siteSettings.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
