import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Availability, AvailabilityStatus } from '../types';

export const AVAILABILITY_COLLECTION = 'availability';

/**
 * Normalizes a date object or string into YYYY-MM-DD
 */
export function formatDateKey(dateStr: string | Date): string {
  if (typeof dateStr === 'string') {
    return dateStr.trim().split('T')[0];
  }
  return dateStr.toISOString().split('T')[0];
}

/**
 * Fetch all dates that cannot be booked by a customer:
 * - Dates marked as BOOKED or BLOCKED in availability collection
 * - Dates with approved bookings in bookings collection
 */
export async function getUnavailableDates(): Promise<string[]> {
  try {
    const unavailableSet = new Set<string>();

    // 1. Fetch from availability collection
    const availSnap = await getDocs(collection(db, AVAILABILITY_COLLECTION));
    availSnap.forEach((docSnap) => {
      const data = docSnap.data() as Availability;
      if (data.date && (data.status === 'BOOKED' || data.status === 'BLOCKED')) {
        unavailableSet.add(data.date);
      }
    });

    // 2. Fetch approved bookings from bookings collection
    const qApproved = query(collection(db, 'bookings'), where('status', '==', 'approved'));
    const bookingsSnap = await getDocs(qApproved);
    bookingsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.preferredDate) {
        unavailableSet.add(data.preferredDate);
      }
    });

    return Array.from(unavailableSet);
  } catch (err) {
    console.error('Failed to get unavailable dates:', err);
    return [];
  }
}

/**
 * Fetch all availability records for admin calendar view
 */
export async function getAllAvailability(): Promise<Availability[]> {
  try {
    const snap = await getDocs(collection(db, AVAILABILITY_COLLECTION));
    const list: Availability[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Availability;
      list.push({ ...data, id: docSnap.id });
    });
    return list;
  } catch (err) {
    console.error('Failed to get all availability:', err);
    return [];
  }
}

/**
 * Admin sets or updates status of a date
 */
export async function setDateAvailability(
  dateStr: string,
  status: AvailabilityStatus,
  reason = '',
  bookingId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanDate = formatDateKey(dateStr);
    const docRef = doc(db, AVAILABILITY_COLLECTION, `avail_${cleanDate}`);
    const now = new Date().toISOString();

    if (status === 'AVAILABLE') {
      // If setting back to available, delete custom override or mark AVAILABLE
      await setDoc(docRef, {
        date: cleanDate,
        status: 'AVAILABLE',
        reason: reason || 'Marked available',
        updatedAt: now,
      });
    } else {
      await setDoc(docRef, {
        date: cleanDate,
        status,
        reason: reason || (status === 'BOOKED' ? 'Booked session' : 'Studio blocked date'),
        bookingId: bookingId || null,
        updatedAt: now,
        createdAt: now,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to set date availability:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin unblocks or deletes availability override
 */
export async function deleteDateAvailability(dateStr: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanDate = formatDateKey(dateStr);
    const docRef = doc(db, AVAILABILITY_COLLECTION, `avail_${cleanDate}`);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Performs atomic transaction check and reservation to guard against race conditions
 */
export async function atomicCheckAndCreateBooking(bookingData: {
  bookingId: string;
  secureToken: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
}): Promise<{ success: boolean; conflict?: boolean; error?: string }> {
  const cleanDate = formatDateKey(bookingData.preferredDate);
  const availRef = doc(db, AVAILABILITY_COLLECTION, `avail_${cleanDate}`);

  try {
    // Check if there is an approved booking for this date before transaction
    const qApproved = query(
      collection(db, 'bookings'),
      where('preferredDate', '==', cleanDate),
      where('status', '==', 'approved')
    );
    const approvedDocs = await getDocs(qApproved);
    if (!approvedDocs.empty) {
      return { success: false, conflict: true, error: 'A confirmed booking already exists for this date.' };
    }

    const result = await runTransaction(db, async (transaction) => {
      const availDoc = await transaction.get(availRef);
      if (availDoc.exists()) {
        const data = availDoc.data() as Availability;
        if (data.status === 'BOOKED' || data.status === 'BLOCKED') {
          return { conflict: true, reason: data.status };
        }
      }

      // Proceed with booking creation
      const bookingDocRef = doc(collection(db, 'bookings'));
      const now = new Date().toISOString();

      transaction.set(bookingDocRef, {
        ...bookingData,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        emailStatus: 'pending',
        whatsappStatus: 'pending',
      });

      return { conflict: false };
    });

    if (result.conflict) {
      return {
        success: false,
        conflict: true,
        error: 'This date/time is no longer available. Please select another date or time.'
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Atomic booking transaction error:', err);
    return { success: false, error: err.message };
  }
}

export type AvailabilityRecord = Availability;

export async function setBlockedDate(
  dateStr: string,
  reason: string,
  adminUser?: string | { uid?: string; email?: string | null }
): Promise<{ success: boolean; error?: string }> {
  return setDateAvailability(dateStr, 'BLOCKED', reason);
}

export async function unblockDate(
  dateStr: string,
  adminUser?: string | { uid?: string; email?: string | null }
): Promise<{ success: boolean; error?: string }> {
  return deleteDateAvailability(dateStr);
}
