import { addDoc, collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, BookingStatus } from '../types';
import * as XLSX from 'xlsx';

export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `1B2-${year}-${randomNum}`;
}

export function generateSecureToken(): string {
  return 'bk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Preview approval email HTML
 */
export async function previewApprovalEmail(booking: Booking): Promise<string> {
  try {
    const res = await fetch('/api/bookings/preview-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.html || '';
    }
  } catch (e) {
    console.warn('Failed to fetch approval email preview:', e);
  }
  return '';
}

/**
 * Admin accepts/approves a booking:
 * 1. Calls server-side /api/bookings/approve for atomic, secure approval & notification
 * 2. Falls back to direct Firestore update if server endpoint is offline
 * 3. Prevents duplicate approval emails
 * 4. Ensures the booking is marked 'approved' even if external notification warns
 */
export async function approveBooking(
  docId: string,
  booking: Booking,
  adminUser?: { uid?: string; email?: string | null },
  forceResendEmail = false
): Promise<{ success: boolean; emailStatus: string; whatsappStatus: string; error?: string }> {
  try {
    // 1. Try server-side approval API route first
    try {
      const apiRes = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          booking,
          adminUser: adminUser || { uid: 'admin-portal', email: 'brucetamilyt@gmail.com' },
          forceResendEmail,
        }),
      });

      if (apiRes.ok) {
        const payload = await apiRes.json();
        if (payload.success) {
          return {
            success: true,
            emailStatus: payload.email?.status || (payload.emailSent ? 'sent' : 'skipped'),
            whatsappStatus: payload.whatsapp?.status || 'sent',
          };
        }
      }
    } catch (apiErr) {
      console.warn('Server approve API error, falling back to client-side Firestore:', apiErr);
    }

    // 2. Direct Firestore fallback
    const now = new Date().toISOString();
    const docRef = doc(db, 'bookings', docId);

    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: now,
      updatedAt: now,
      adminId: adminUser?.uid || 'admin-portal',
      approval_email_sent: true,
      approval_email_sent_at: now,
    });

    // Lock availability date
    try {
      const cleanDate = booking.preferredDate.trim().split('T')[0];
      const availRef = doc(db, 'availability', `avail_${cleanDate}`);
      await setDoc(availRef, {
        date: cleanDate,
        status: 'BOOKED',
        reason: `Booked for ${booking.service} (${booking.bookingId})`,
        bookingId: booking.bookingId,
        updatedAt: now,
      }, { merge: true });
    } catch (availErr) {
      console.warn('Could not update availability doc on approval:', availErr);
    }

    // Audit log
    try {
      await addDoc(collection(db, 'auditLogs'), {
        adminId: adminUser?.uid || 'admin-portal',
        adminEmail: adminUser?.email || 'brucetamilyt@gmail.com',
        action: 'BOOKING_APPROVED',
        bookingId: booking.bookingId,
        timestamp: now,
        details: {
          clientName: booking.clientName,
          service: booking.service,
          preferredDate: booking.preferredDate,
        },
      });
    } catch (auditErr) {}

    // Trigger notification
    let emailStatus = 'sent';
    let whatsappStatus = 'sent';

    try {
      const notifRes = await fetch('/api/bookings/dispatch-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking, forceResend: forceResendEmail }),
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        emailStatus = notifData.email?.status || 'sent';
        whatsappStatus = notifData.whatsapp?.status || 'sent';
      }
    } catch (notifErr) {
      emailStatus = 'failed';
      whatsappStatus = 'failed';
    }

    await updateDoc(docRef, {
      emailStatus,
      whatsappStatus,
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
  adminUser?: { uid?: string; email?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try server-side rejection
    try {
      const apiRes = await fetch('/api/bookings/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          booking,
          reason,
          adminUser: adminUser || { uid: 'admin-portal', email: 'brucetamilyt@gmail.com' },
        }),
      });

      if (apiRes.ok) {
        const payload = await apiRes.json();
        if (payload.success) return { success: true };
      }
    } catch (apiErr) {
      console.warn('Server reject API error, using direct Firestore:', apiErr);
    }

    // 2. Direct Firestore fallback
    const now = new Date().toISOString();
    const docRef = doc(db, 'bookings', docId);

    await updateDoc(docRef, {
      status: 'rejected',
      rejectedAt: now,
      updatedAt: now,
      rejectionReason: reason || 'Scheduling conflict',
      adminId: adminUser?.uid || 'admin-portal',
    });

    try {
      await addDoc(collection(db, 'auditLogs'), {
        adminId: adminUser?.uid || 'admin-portal',
        adminEmail: adminUser?.email || 'brucetamilyt@gmail.com',
        action: 'BOOKING_REJECTED',
        bookingId: booking.bookingId,
        timestamp: now,
        details: { reason },
      });
    } catch (e) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Clean data mapping for exported sheets
 */
export function formatBookingsForExport(bookings: Booking[]) {
  return bookings.map((b) => ({
    'Booking ID': b.bookingId,
    'Client Name': b.clientName,
    'Email': b.clientEmail,
    'Phone Number': b.clientPhone,
    'Selected Service / Shoot': b.service,
    'Preferred Date': b.preferredDate,
    'Preferred Time': b.preferredTime || 'Flexible',
    'Client Message / Requirements': b.message || '',
    'Booking Date': b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
    'Approval Date': b.approvedAt ? new Date(b.approvedAt).toLocaleDateString() : (b.status === 'approved' ? 'Approved' : 'N/A'),
    'Status': (b.status || 'pending').toUpperCase(),
    'Admin Notes': b.adminNotes || '',
    'Rejection Reason': b.rejectionReason || '',
  }));
}

/**
 * Download bookings as formatted Excel (.xlsx)
 */
export function exportBookingsToExcel(bookings: Booking[], fileName = '1by2_Studio_Approved_Bookings.xlsx') {
  const data = formatBookingsForExport(bookings);
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readability
  const colWidths = [
    { wch: 18 }, // Booking ID
    { wch: 22 }, // Client Name
    { wch: 26 }, // Email
    { wch: 16 }, // Phone Number
    { wch: 22 }, // Selected Service
    { wch: 14 }, // Preferred Date
    { wch: 14 }, // Preferred Time
    { wch: 35 }, // Client Message
    { wch: 14 }, // Booking Date
    { wch: 14 }, // Approval Date
    { wch: 12 }, // Status
    { wch: 25 }, // Admin Notes
    { wch: 20 }, // Rejection Reason
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Approved Bookings');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Download bookings as CSV (.csv)
 */
export function exportBookingsToCsv(bookings: Booking[], fileName = '1by2_Studio_Approved_Bookings.csv') {
  const data = formatBookingsForExport(bookings);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

