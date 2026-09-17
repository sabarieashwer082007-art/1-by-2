import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, BookingStatus } from '../types';

export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `1B2-${year}-${randomNum}`;
}

export function generateSecureToken(): string {
  return 'bk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a new booking in Firestore and triggers admin email notification.
 * Performs mandatory server-side conflict check to prevent double bookings.
 */
export async function createBooking(data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
}): Promise<{ success: boolean; bookingId: string; secureToken: string; conflict?: boolean; error?: string }> {
  try {
    const bookingId = generateBookingId();
    const secureToken = generateSecureToken();

    // 1. Try server-side conflict check and creation first
    try {
      const apiRes = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          bookingId,
          secureToken,
        }),
      });

      const apiData = await apiRes.json();
      if (apiRes.status === 409 || apiData.conflict) {
        return {
          success: false,
          bookingId: '',
          secureToken: '',
          conflict: true,
          error: apiData.error || 'This date/time is no longer available. Please select another date or time.'
        };
      }

      if (!apiRes.ok) {
        throw new Error(apiData.error || 'Server error creating booking');
      }

      return {
        success: true,
        bookingId: apiData.bookingId || bookingId,
        secureToken: apiData.secureToken || secureToken,
      };
    } catch (apiErr: any) {
      console.warn('API route error, falling back to direct atomic transaction check:', apiErr);

      // Fallback: Use direct atomic transaction check against Firestore
      const { atomicCheckAndCreateBooking } = await import('./availabilityService');
      const directResult = await atomicCheckAndCreateBooking({
        ...data,
        bookingId,
        secureToken,
      });

      if (!directResult.success) {
        return {
          success: false,
          bookingId: '',
          secureToken: '',
          conflict: directResult.conflict,
          error: directResult.error || 'Unable to submit booking. Please try another date.'
        };
      }

      // Try triggering notification email
      fetch('/api/notifications/new-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: {
            ...data,
            bookingId,
            secureToken,
          }
        }),
      }).catch(console.warn);

      return { success: true, bookingId, secureToken };
    }
  } catch (err: any) {
    console.error('Failed to create booking:', err);
    return { success: false, bookingId: '', secureToken: '', error: err.message || 'Booking submission failed' };
  }
}

/**
 * Admin accepts/approves a booking:
 * 1. Checks current status & idempotency (prevents duplicate dispatch)
 * 2. Updates status to approved, approvedAt, adminId in Firestore
 * 3. Logs audit trail
 * 4. Triggers customer email and WhatsApp via backend API
 * 5. Records delivery status without reverting approved state if external notification fails
 */
export async function approveBooking(
  docId: string,
  booking: Booking,
  adminUser: { uid: string; email?: string | null }
): Promise<{ success: boolean; emailStatus: string; whatsappStatus: string; error?: string }> {
  try {
    // Idempotency check: if already approved, prevent duplicate notifications
    if (booking.status === 'approved') {
      return {
        success: true,
        emailStatus: booking.emailStatus || 'sent',
        whatsappStatus: booking.whatsappStatus || 'sent',
      };
    }

    const now = new Date().toISOString();
    const docRef = doc(db, 'bookings', docId);

    // Step 1: Update Firestore status first
    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: now,
      updatedAt: now,
      adminId: adminUser.uid,
    });

    // Step 2: Write audit log
    await addDoc(collection(db, 'auditLogs'), {
      adminId: adminUser.uid,
      adminEmail: adminUser.email || 'admin@1by2studio.com',
      action: 'BOOKING_APPROVED',
      bookingId: booking.bookingId,
      timestamp: now,
      details: {
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        clientEmail: booking.clientEmail,
        service: booking.service,
        preferredDate: booking.preferredDate,
      }
    });

    // Step 3: Dispatch customer email and WhatsApp notification
    let emailStatus: 'sent' | 'failed' | 'not_configured' = 'not_configured';
    let whatsappStatus: 'sent' | 'failed' | 'not_configured' = 'not_configured';
    let emailErr = '';
    let whatsappErr = '';

    try {
      const res = await fetch('/api/bookings/dispatch-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking }),
      });

      if (res.ok) {
        const payload = await res.json();
        emailStatus = payload.email?.status || 'sent';
        whatsappStatus = payload.whatsapp?.status || 'sent';
        emailErr = payload.email?.error || '';
        whatsappErr = payload.whatsapp?.error || '';

        // Save email audit log
        await addDoc(collection(db, 'emailLogs'), {
          recipient: booking.clientEmail,
          bookingId: booking.bookingId,
          type: 'booking_approved',
          subject: 'Your Photography Booking Has Been Approved — 1 by 2 Studio',
          status: emailStatus,
          providerMessageId: payload.email?.providerMessageId || null,
          createdAt: now,
          sentAt: emailStatus === 'sent' ? now : null,
          error: emailErr,
          retryCount: 0,
        });

        // Save WhatsApp audit log
        await addDoc(collection(db, 'whatsappLogs'), {
          phone: booking.clientPhone,
          bookingId: booking.bookingId,
          type: 'booking_approved',
          status: whatsappStatus,
          providerMessageId: payload.whatsapp?.providerMessageId || null,
          createdAt: now,
          sentAt: whatsappStatus === 'sent' ? now : null,
          error: whatsappErr,
          retryCount: 0,
        });
      }
    } catch (dispatchErr: any) {
      emailStatus = 'failed';
      whatsappStatus = 'failed';
      emailErr = dispatchErr.message;
    }

    // Step 4: Record notification delivery statuses on booking record
    await updateDoc(docRef, {
      emailStatus,
      whatsappStatus,
      lastEmailError: emailErr || null,
      lastWhatsappError: whatsappErr || null,
    });

    return { success: true, emailStatus, whatsappStatus };
  } catch (err: any) {
    console.error('Failed to approve booking:', err);
    return { success: false, emailStatus: 'failed', whatsappStatus: 'failed', error: err.message };
  }
}

/**
 * Admin rejects a booking with reason
 */
export async function rejectBooking(
  docId: string,
  booking: Booking,
  reason: string,
  adminUser: { uid: string; email?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const docRef = doc(db, 'bookings', docId);

    await updateDoc(docRef, {
      status: 'rejected',
      rejectedAt: now,
      updatedAt: now,
      rejectionReason: reason || 'Scheduling conflict',
      adminId: adminUser.uid,
    });

    await addDoc(collection(db, 'auditLogs'), {
      adminId: adminUser.uid,
      adminEmail: adminUser.email || 'admin@1by2studio.com',
      action: 'BOOKING_REJECTED',
      bookingId: booking.bookingId,
      timestamp: now,
      details: { reason }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
