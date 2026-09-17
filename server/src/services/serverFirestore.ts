import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../src/lib/firebase.ts';

/**
 * Normalizes date to YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.trim().split('T')[0];
}

/**
 * Server-side check for date conflicts against:
 * 1. availability collection (marked BOOKED or BLOCKED)
 * 2. bookings collection (status === 'approved')
 */
export async function checkDateConflictOnServer(dateStr: string): Promise<{ conflict: boolean; reason?: string }> {
  try {
    const cleanDate = normalizeDate(dateStr);
    if (!cleanDate) return { conflict: false };

    // 1. Check availability document
    const availDocRef = doc(db, 'availability', `avail_${cleanDate}`);
    const availSnap = await getDoc(availDocRef);
    if (availSnap.exists()) {
      const data = availSnap.data();
      if (data && (data.status === 'BOOKED' || data.status === 'BLOCKED')) {
        return {
          conflict: true,
          reason: data.status === 'BOOKED' ? 'Date is already booked' : (data.reason || 'Date is blocked by studio')
        };
      }
    }

    // 2. Check approved bookings on this date
    const qApproved = query(
      collection(db, 'bookings'),
      where('preferredDate', '==', cleanDate),
      where('status', '==', 'approved')
    );
    const approvedSnap = await getDocs(qApproved);
    if (!approvedSnap.empty) {
      return {
        conflict: true,
        reason: 'A confirmed booking already exists for this date'
      };
    }

    return { conflict: false };
  } catch (err: any) {
    console.error('Error during server-side date conflict check:', err);
    // If error in query, log and return no conflict or handle safely
    return { conflict: false };
  }
}

/**
 * Fetch all unavailable dates on server for public calendar
 */
export async function getUnavailableDatesOnServer(): Promise<string[]> {
  try {
    const dates = new Set<string>();

    const availSnap = await getDocs(collection(db, 'availability'));
    availSnap.forEach((d) => {
      const data = d.data();
      if (data.date && (data.status === 'BOOKED' || data.status === 'BLOCKED')) {
        dates.add(data.date);
      }
    });

    const qApproved = query(collection(db, 'bookings'), where('status', '==', 'approved'));
    const bookingsSnap = await getDocs(qApproved);
    bookingsSnap.forEach((d) => {
      const data = d.data();
      if (data.preferredDate) {
        dates.add(data.preferredDate);
      }
    });

    return Array.from(dates);
  } catch (err) {
    console.error('Error fetching unavailable dates on server:', err);
    return [];
  }
}

/**
 * Server-side atomic booking creation with race condition protection
 */
export async function createBookingOnServer(bookingData: {
  bookingId: string;
  secureToken: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}): Promise<{ success: boolean; conflict?: boolean; error?: string }> {
  try {
    const cleanDate = normalizeDate(bookingData.preferredDate);
    const availDocRef = doc(db, 'availability', `avail_${cleanDate}`);

    const result = await runTransaction(db, async (transaction) => {
      // 1. Transactional read of availability
      const availDoc = await transaction.get(availDocRef);
      if (availDoc.exists()) {
        const data = availDoc.data();
        if (data.status === 'BOOKED' || data.status === 'BLOCKED') {
          return { conflict: true, reason: data.status };
        }
      }

      // 2. Query approved bookings
      const qApproved = query(
        collection(db, 'bookings'),
        where('preferredDate', '==', cleanDate),
        where('status', '==', 'approved')
      );
      const approvedDocs = await getDocs(qApproved);
      if (!approvedDocs.empty) {
        return { conflict: true, reason: 'BOOKED' };
      }

      // 3. Write booking document
      const bookingDocRef = doc(collection(db, 'bookings'));
      const now = new Date().toISOString();

      transaction.set(bookingDocRef, {
        bookingId: bookingData.bookingId,
        secureToken: bookingData.secureToken,
        clientName: bookingData.clientName.trim(),
        clientEmail: bookingData.clientEmail.trim().toLowerCase(),
        clientPhone: bookingData.clientPhone.trim(),
        service: bookingData.service,
        preferredDate: cleanDate,
        preferredTime: bookingData.preferredTime || 'Flexible',
        message: bookingData.message ? bookingData.message.trim() : '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        emailStatus: 'pending',
        whatsappStatus: 'pending',
      });

      // 4. Create admin notification
      const notifDocRef = doc(collection(db, 'notifications'));
      transaction.set(notifDocRef, {
        type: 'new_booking',
        bookingId: bookingData.bookingId,
        title: 'New Booking Received',
        message: `${bookingData.clientName} booked for ${bookingData.service} on ${cleanDate}`,
        read: false,
        createdAt: now,
      });

      return { conflict: false };
    });

    if (result.conflict) {
      return {
        success: false,
        conflict: true,
        error: 'This date/time is no longer available. Please select another date or time.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Server booking creation failed:', err);
    return { success: false, error: err.message };
  }
}
