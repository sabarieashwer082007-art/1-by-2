import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../src/lib/firebase.ts';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const adminApp =
  getApps().find((app) => app.name === 'booking-admin') ??
  initializeApp(
    {
      credential: applicationDefault(),
      projectId: 'gen-lang-client-0012370071',
    },
    'booking-admin'
  );

export const adminDb = getFirestore(adminApp,
  'ai-studio-6ebd946f-cfae-44e6-bb54-80ce38059535'
);

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

    // Pre-check approved bookings for this date before transaction
    const qApproved = query(
      collection(db, 'bookings'),
      where('preferredDate', '==', cleanDate),
      where('status', '==', 'approved')
    );
    const approvedDocs = await getDocs(qApproved);
    if (!approvedDocs.empty) {
      return {
        success: false,
        conflict: true,
        error: 'This date/time is no longer available. Please select another date or time.',
      };
    }

    const result = await runTransaction(db, async (transaction) => {
      // 1. Transactional read of availability
      const availDoc = await transaction.get(availDocRef);
      if (availDoc.exists()) {
        const data = availDoc.data();
        if (data && (data.status === 'BOOKED' || data.status === 'BLOCKED')) {
          return { conflict: true, reason: data.status };
        }
      }

      // 2. Write booking document
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

      // 3. Create admin notification
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

/**
 * Server-side Booking Approval
 * Performs atomic-like updates: status, approvedAt, availability locked, audit log
 */
export async function approveBookingOnServer(
  identifier: string,
  adminInfo?: { uid?: string; email?: string }
): Promise<{ success: boolean; booking?: any; docId?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    let targetDocRef = doc(db, 'bookings', identifier);
    let snap = await getDoc(targetDocRef);
    let resolvedDocId = identifier;

    if (!snap.exists()) {
      // Try searching by bookingId field
      const q = query(collection(db, 'bookings'), where('bookingId', '==', identifier));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        targetDocRef = querySnap.docs[0].ref;
        snap = querySnap.docs[0];
        resolvedDocId = snap.id;
      } else {
        return { success: false, error: `Booking ${identifier} not found in database.` };
      }
    }

    const bookingData = snap.data();
    if (!bookingData) {
      return { success: false, error: `Booking data for ${identifier} is missing or corrupt.` };
    }
    if (bookingData.status === 'approved') {
      return { success: true, booking: { id: resolvedDocId, ...bookingData }, docId: resolvedDocId };
    }

    const cleanDate = normalizeDate(bookingData.preferredDate);

    // 1. Update booking document
    await updateDoc(targetDocRef, {
      status: 'approved',
      approvedAt: now,
      updatedAt: now,
      adminId: adminInfo?.uid || 'admin-portal',
      adminEmail: adminInfo?.email || 'brucetamilyt@gmail.com',
    });

    // 2. Lock availability date
    if (cleanDate) {
      try {
        const availRef = doc(db, 'availability', `avail_${cleanDate}`);
        await setDoc(availRef, {
          date: cleanDate,
          status: 'BOOKED',
          bookingId: bookingData.bookingId,
          reason: `Approved session for ${bookingData.clientName}`,
          updatedAt: now,
        }, { merge: true });
      } catch (availErr) {
        console.warn('Could not update availability document:', availErr);
      }
    }

    // 3. Create audit log
    try {
      await addDoc(collection(db, 'auditLogs'), {
        bookingId: bookingData.bookingId,
        action: 'booking_approved',
        adminId: adminInfo?.uid || 'admin-portal',
        adminEmail: adminInfo?.email || 'brucetamilyt@gmail.com',
        timestamp: now,
        details: {
          clientName: bookingData.clientName,
          service: bookingData.service,
          date: cleanDate,
        },
      });
    } catch (auditErr) {
      console.warn('Could not create auditLog:', auditErr);
    }

    const updatedBooking = {
      ...bookingData,
      id: resolvedDocId,
      status: 'approved',
      approvedAt: now,
      updatedAt: now,
    };

    return { success: true, booking: updatedBooking, docId: resolvedDocId };
  } catch (err: any) {
    console.error('approveBookingOnServer error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server-side Booking Rejection
 */


export async function rejectBookingOnServer(
  identifier: string,
  reason: string,
  adminInfo?: { uid?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    const bookingsCollection = adminDb.collection('bookings');

    let targetDocRef = bookingsCollection.doc(identifier);
    let snap = await targetDocRef.get();

    // If the document ID doesn't match, search by bookingId.
    if (!snap.exists) {
      const querySnap = await bookingsCollection
        .where('bookingId', '==', identifier)
        .limit(1)
        .get();

      if (querySnap.empty) {
        return {
          success: false,
          error: `Booking ${identifier} not found.`,
        };
      }

      snap = querySnap.docs[0];
      targetDocRef = snap.ref;
    }

    const bookingData = snap.data();

    if (!bookingData) {
      return {
        success: false,
        error: `Booking data for ${identifier} is missing or corrupt.`,
      };
    }

    // Update the booking using Firebase Admin.
    await targetDocRef.update({
      status: 'rejected',
      rejectedAt: now,
      rejectionReason: reason || 'Scheduling conflict',
      updatedAt: now,
      adminId: adminInfo?.uid || 'admin-portal',
      adminEmail: adminInfo?.email || 'brucetamilyt@gmail.com',
    });

    // Record the rejection in the audit log.
    try {
      await adminDb.collection('auditLogs').add({
        bookingId: bookingData.bookingId,
        action: 'booking_rejected',
        reason: reason || 'Scheduling conflict',
        adminId: adminInfo?.uid || 'admin-portal',
        adminEmail: adminInfo?.email || 'brucetamilyt@gmail.com',
        timestamp: now,
      });
    } catch (auditError) {
      console.error('Could not create rejection audit log:', auditError);
    }

    console.log('Booking rejected successfully:', identifier);

    return { success: true };
  } catch (err: any) {
    console.error('rejectBookingOnServer error:', err);

    return {
      success: false,
      error: err.message || 'Failed to reject booking.',
    };
  }
}
