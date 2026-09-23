import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gallery, GalleryPhoto } from '../types';

export const GALLERIES_COLLECTION = 'galleries';

/**
 * Generates an unguessable, cryptographically secure random token for private client gallery access
 */
export function generateSecureGalleryToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'gal_' + crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).substring(2, 8);
  }
  return 'gal_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Calculates expiration ISO string based on selected period
 */
export function calculateExpirationDate(period: '24h' | '3d' | '7d' | '30d' | 'custom', customDays = 7): string {
  const d = new Date();
  switch (period) {
    case '24h':
      d.setHours(d.getHours() + 24);
      break;
    case '3d':
      d.setDate(d.getDate() + 3);
      break;
    case '7d':
      d.setDate(d.getDate() + 7);
      break;
    case '30d':
      d.setDate(d.getDate() + 30);
      break;
    case 'custom':
      d.setDate(d.getDate() + (customDays > 0 ? customDays : 7));
      break;
    default:
      d.setDate(d.getDate() + 7);
  }
  return d.toISOString();
}

/**
 * Fetch gallery for a specific booking
 */
export async function getGalleryByBookingId(bookingId: string): Promise<Gallery | null> {
  try {
    const q = query(collection(db, GALLERIES_COLLECTION), where('bookingId', '==', bookingId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data() as Gallery;
      return { ...docData, id: snap.docs[0].id };
    }
    return null;
  } catch (err) {
    console.error('Failed to get gallery by booking ID:', err);
    return null;
  }
}

/**
 * Fetch and validate gallery by secure token for customer view
 */
export async function getGalleryByToken(token: string): Promise<{
  gallery: Gallery | null;
  status: 'valid' | 'expired' | 'revoked' | 'not_found';
  error?: string;
}> {
  try {
    const cleanToken = token.trim();
    const q = query(collection(db, GALLERIES_COLLECTION), where('secureToken', '==', cleanToken));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { gallery: null, status: 'not_found', error: 'Gallery not found.' };
    }

    const galleryDoc = snap.docs[0];
    const data = galleryDoc.data() as Gallery;
    const gallery: Gallery = { ...data, id: galleryDoc.id };

    // Check if revoked
    if (!gallery.active) {
      return { gallery: null, status: 'revoked', error: 'This gallery link is no longer available.' };
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(gallery.expiresAt);
    if (now > expiresAt) {
      return { gallery: null, status: 'expired', error: 'This gallery link has expired. Please contact 1 by 2 Studio.' };
    }

    // Filter to only visible photos for client
    const visiblePhotos = (gallery.photos || [])
      .filter((p) => p.visible !== false)
      .sort((a, b) => a.order - b.order);

    return {
      gallery: {
        ...gallery,
        photos: visiblePhotos,
      },
      status: 'valid',
    };
  } catch (err: any) {
    console.error('Failed to get gallery by token:', err);
    return { gallery: null, status: 'not_found', error: err.message };
  }
}

/**
 * Admin generates or regenerates a private gallery link for a booking
 */
export async function generateGalleryLink(params: {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  service: string;
  expirationPeriod: '24h' | '3d' | '7d' | '30d' | 'custom';
  customDays?: number;
  adminUser: { uid: string; email?: string | null };
}): Promise<{ success: boolean; gallery: Gallery | null; error?: string }> {
  try {
    const now = new Date().toISOString();
    const expiresAt = calculateExpirationDate(params.expirationPeriod, params.customDays);
    const secureToken = generateSecureGalleryToken();

    // Check if an existing gallery document exists for this booking
    const existingGallery = await getGalleryByBookingId(params.bookingId);
    let docId: string;

    const galleryPayload: Gallery = {
      galleryId: existingGallery?.galleryId || 'GAL-' + params.bookingId,
      bookingId: params.bookingId,
      secureToken,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      service: params.service,
      createdAt: existingGallery?.createdAt || now,
      expiresAt,
      active: true,
      photos: existingGallery?.photos || [],
    };

    if (existingGallery && existingGallery.id) {
      docId = existingGallery.id;
      await updateDoc(doc(db, GALLERIES_COLLECTION, docId), {
        secureToken,
        expiresAt,
        active: true,
        revokedAt: null,
      });
    } else {
      const newDocRef = await addDoc(collection(db, GALLERIES_COLLECTION), galleryPayload);
      docId = newDocRef.id;
    }

    // Write audit log
    await addDoc(collection(db, 'auditLogs'), {
      adminId: params.adminUser.uid,
      adminEmail: params.adminUser.email || 'admin@1by2studio.com',
      action: 'GALLERY_LINK_GENERATED',
      bookingId: params.bookingId,
      timestamp: now,
      details: {
        secureToken,
        expiresAt,
        expirationPeriod: params.expirationPeriod,
      },
    });

    return {
      success: true,
      gallery: { ...galleryPayload, id: docId },
    };
  } catch (err: any) {
    console.error('Failed to generate gallery link:', err);
    return { success: false, gallery: null, error: err.message };
  }
}

/**
 * Admin revokes a private gallery link immediately
 */
export async function revokeGalleryLink(
  galleryId: string,
  bookingId: string,
  adminUser: { uid: string; email?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const docRef = doc(db, GALLERIES_COLLECTION, galleryId);

    await updateDoc(docRef, {
      active: false,
      revokedAt: now,
    });

    // Write audit log
    await addDoc(collection(db, 'auditLogs'), {
      adminId: adminUser.uid,
      adminEmail: adminUser.email || 'admin@1by2studio.com',
      action: 'GALLERY_LINK_REVOKED',
      bookingId,
      timestamp: now,
      details: { galleryId },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to revoke gallery link:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin updates photos of a gallery (upload, reorder, delete, caption, hide/show)
 */
export async function updateGalleryPhotos(
  galleryId: string,
  photos: GalleryPhoto[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, GALLERIES_COLLECTION, galleryId);
    await updateDoc(docRef, {
      photos,
    });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update gallery photos:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends private gallery link email and WhatsApp to client
 */
export async function dispatchGalleryLink(params: {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  secureToken: string;
  expiresAt: string;
}): Promise<{
  success: boolean;
  emailStatus: 'sent' | 'failed' | 'not_configured';
  whatsappStatus: 'sent' | 'failed' | 'not_configured';
  error?: string;
}> {
  try {
    const res = await fetch('/api/galleries/send-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        emailStatus: data.email?.status || 'failed',
        whatsappStatus: data.whatsapp?.status || 'failed',
        error: data.error || 'Failed to dispatch gallery link',
      };
    }

    const now = new Date().toISOString();

    // Log to emailLogs
    await addDoc(collection(db, 'emailLogs'), {
      recipient: params.clientEmail,
      bookingId: params.bookingId,
      type: 'gallery_link',
      subject: 'Your Final Photo Gallery — 1 by 2 Studio',
      status: data.email?.status || 'not_configured',
      providerMessageId: data.email?.providerMessageId || null,
      createdAt: now,
      sentAt: data.email?.status === 'sent' ? now : null,
      error: data.email?.error || '',
      retryCount: 0,
    });

    // Log to whatsappLogs
    if (params.clientPhone) {
      await addDoc(collection(db, 'whatsappLogs'), {
        phone: params.clientPhone,
        bookingId: params.bookingId,
        type: 'gallery_link',
        status: data.whatsapp?.status || 'not_configured',
        providerMessageId: data.whatsapp?.providerMessageId || null,
        createdAt: now,
        sentAt: data.whatsapp?.status === 'sent' ? now : null,
        error: data.whatsapp?.error || '',
        retryCount: 0,
      });
    }

    return {
      success: data.email?.status === 'sent' || data.whatsapp?.status === 'sent',
      emailStatus: data.email?.status || 'not_configured',
      whatsappStatus: data.whatsapp?.status || 'not_configured',
      error: data.email?.error || data.whatsapp?.error,
    };
  } catch (err: any) {
    console.error('Failed to dispatch gallery notifications:', err);
    return {
      success: false,
      emailStatus: 'failed',
      whatsappStatus: 'failed',
      error: err.message,
    };
  }
}
