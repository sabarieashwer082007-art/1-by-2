import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { useToast } from '../context/ToastContext';
import { createBooking } from '../services/bookingService';
import { BookingCalendarPicker } from '../components/BookingCalendarPicker';

interface BookingPageProps {
  initialService?: string;
  onNavigate: (page: string, params?: { bookingId?: string; token?: string }) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ initialService, onNavigate }) => {
  const { siteSettings } = useStudio();
  const { showSuccess, showError, showLoading, dismissToast } = useToast();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState(initialService || 'Wedding Photography');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM - 1:00 PM)');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    bookingId: string;
    secureToken: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const servicesList = [
    'Wedding Photography',
    'Pre-Wedding & Couple Sessions',
    'Portrait & Headshots',
    'Event & Celebrations',
    'Fashion & Editorial',
    'Commercial & Product',
    'Custom Assignment',
  ];

  const timeSlots = [
    'Morning (9:00 AM - 1:00 PM)',
    'Afternoon (1:00 PM - 4:00 PM)',
    'Golden Hour / Evening (4:00 PM - 7:30 PM)',
    'Full Day Dedicated Coverage',
    'Flexible / Multiple Days',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      const err = 'Please enter your full name.';
      setErrorMsg(err);
      showError(err);
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      const err = 'Please enter a valid email address.';
      setErrorMsg(err);
      showError(err);
      return;
    }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 8) {
      const err = 'Please provide a valid contact phone number.';
      setErrorMsg(err);
      showError(err);
      return;
    }
    if (!preferredDate) {
      const err = 'Please select your preferred session or event date.';
      setErrorMsg(err);
      showError(err);
      return;
    }

    setSubmitting(true);
    const toastId = showLoading('Verifying availability and submitting reservation...');

    try {
      const result = await createBooking({
        clientName,
        clientEmail,
        clientPhone,
        service,
        preferredDate,
        preferredTime,
        message,
      });

      dismissToast(toastId);

      if (result.success) {
        showSuccess('Booking request submitted successfully.');
        setSubmittedBooking({
          bookingId: result.bookingId,
          secureToken: result.secureToken,
        });
      } else {
        const msg = result.error || (result.conflict 
          ? 'This date/time is no longer available. Please select another date or time.' 
          : 'Unable to submit booking. Please try again.');
        setErrorMsg(msg);
        showError(msg);
      }
    } catch (err: any) {
      dismissToast(toastId);
      const msg = err.message || 'An unexpected error occurred during submission.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="booking-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
              RESERVATIONS &amp; COMMISSIONS
            </span>
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-light leading-tight text-[#1C1C1A]">
            Book a Session
          </h1>

          <p className="text-[15px] sm:text-[16px] text-[#66645F] font-sans leading-relaxed">
            Reserve your preferred photography date. Once submitted, our creative director will review date coordination and provide confirmation.
          </p>
        </div>

        {submittedBooking ? (
          /* Confirmation Screen */
          <div
            id="booking-confirmation-card"
            className="p-8 sm:p-12 rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] text-center space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[#E8E3DB] border border-[#D8D2C8] text-[#6B4F3A]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold block font-sans">
                REQUEST LOGGED
              </span>
              <h2 className="font-heading text-3xl font-light text-[#1C1C1A]">
                Booking Submitted Successfully
              </h2>
              <p className="text-sm text-[#66645F] max-w-md mx-auto font-sans leading-relaxed">
                Your session request has been entered into the studio registry. A coordination notice has been dispatched to our team.
              </p>
            </div>

            {/* Summary Card */}
            <div className="max-w-md mx-auto p-6 rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-left space-y-3 font-sans">
              <div className="flex justify-between items-center text-sm border-b border-[#D8D2C8] pb-2">
                <span className="text-[#66645F]">Booking ID:</span>
                <span className="font-mono font-semibold text-[#1C1C1A]">{submittedBooking.bookingId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#66645F]">Patron:</span>
                <span className="font-medium text-[#1C1C1A]">{clientName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#66645F]">Discipline:</span>
                <span className="font-medium text-[#1C1C1A]">{service}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#66645F]">Date &amp; Slot:</span>
                <span className="font-medium text-[#1C1C1A]">{preferredDate} ({preferredTime})</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-[#D8D2C8]">
                <span className="text-[#66645F]">Current Status:</span>
                <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-[#E8E3DB] text-[#6B4F3A] border border-[#D8D2C8]">
                  PENDING REVIEW
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                id="view-customer-booking-btn"
                onClick={() => onNavigate('booking-status', { token: submittedBooking.secureToken })}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans uppercase tracking-[0.08em] font-medium rounded-[4px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Check Live Booking Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSubmittedBooking(null);
                  setClientName('');
                  setMessage('');
                }}
                className="w-full sm:w-auto px-6 py-3.5 text-[13px] font-sans uppercase tracking-[0.08em] font-medium border border-[#1C1C1A] rounded-[4px] text-[#1C1C1A] hover:bg-[#E8E3DB] transition-colors"
              >
                Submit Another Request
              </button>
            </div>

            <div className="text-xs text-[#66645F] pt-2 font-sans">
              Urgent inquiries? Speak with our director directly at <a href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`} className="text-[#1C1C1A] font-semibold underline">{siteSettings.phone}</a>
            </div>
          </div>
        ) : (
          /* Real Form */
          <div className="p-8 sm:p-12 rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] shadow-sm">
            {errorMsg && (
              <div className="mb-8 p-4 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 font-sans">
              {/* Section 1: Patron Info */}
              <div className="space-y-4">
                <h3 className="font-heading text-2xl text-[#1C1C1A] font-light border-b border-[#D8D2C8] pb-2">
                  01. Patron Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senthil Kumar"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. senthil@example.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                    Mobile / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98400 12345"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Requirements */}
              <div className="space-y-6 pt-4">
                <h3 className="font-heading text-2xl text-[#1C1C1A] font-light border-b border-[#D8D2C8] pb-2">
                  02. Photography Requirements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                      Photography Service *
                    </label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A] transition-colors"
                    >
                      {servicesList.map((svc) => (
                        <option key={svc} value={svc}>{svc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                      Preferred Date *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F] pointer-events-none" />
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time studio availability calendar */}
                <div className="pt-2">
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-3 text-[#66645F]">
                    Studio Schedule &amp; Open Dates
                  </label>
                  <BookingCalendarPicker
                    selectedDate={preferredDate}
                    onSelectDate={(dateStr) => {
                      setPreferredDate(dateStr);
                      setErrorMsg('');
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                    Preferred Time Window
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A] transition-colors"
                    >
                      {timeSlots.map((ts) => (
                        <option key={ts} value={ts}>{ts}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F]">
                    Additional Notes &amp; Vision Details
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                    <textarea
                      rows={4}
                      placeholder="Venue location, number of guests, specific moodboards or preferences..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Bar */}
              <div className="pt-6 border-t border-[#D8D2C8]">
                <div className="flex items-center gap-2 text-xs text-[#66645F] mb-6">
                  <ShieldCheck className="w-4 h-4 text-[#6B4F3A] shrink-0" />
                  <span>Patron data is strictly confidential and used solely for session coordination.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  id="submit-booking-form-btn"
                  className="w-full py-4 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm"
                  style={{ opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#F4F1EC] border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Reservation...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Submit Booking Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
