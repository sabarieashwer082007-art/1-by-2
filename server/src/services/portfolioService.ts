import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../src/lib/firebase.ts';
import { INITIAL_PORTFOLIO } from '../../../src/data/defaults.ts';

export interface ServerPortfolioItem {
  id?: string;
  title: string;
  category: string;
  imageUrl: string;
  description?: string;
  featured: boolean;
  visible: boolean;
  order: number;
  tags?: string[];
  aspectRatio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaAsset {
  id?: string;
  title: string;
  url: string;
  section: 'portfolio' | 'hero' | 'services' | 'about' | 'general';
  category?: string;
  size?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all portfolio items, seeding defaults into Firestore if empty
 */
export async function getPortfolioItems(): Promise<ServerPortfolioItem[]> {
  try {
    const q = query(collection(db, 'portfolio'), orderBy('order', 'asc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }

    // Seed initial defaults into Firestore
    console.log('[portfolioService] Portfolio is empty. Seeding initial defaults into Firestore...');
    const seeded: ServerPortfolioItem[] = [];
    for (let i = 0; i < INITIAL_PORTFOLIO.length; i++) {
      const p = INITIAL_PORTFOLIO[i];
      const docRef = await addDoc(collection(db, 'portfolio'), {
        ...p,
        order: i + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      seeded.push({ id: docRef.id, ...p, order: i + 1 });
    }
    return seeded;
  } catch (err) {
    console.error('[portfolioService] Error fetching portfolio items:', err);
    // Fallback to initial portfolio with stable IDs
    return INITIAL_PORTFOLIO.map((p, i) => ({ id: `default_${i}`, ...p, order: i + 1 }));
  }
}

/**
 * Create a new portfolio item
 */
export async function createPortfolioItem(item: Omit<ServerPortfolioItem, 'id'>): Promise<ServerPortfolioItem> {
  const now = new Date().toISOString();
  const payload = {
    ...item,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, 'portfolio'), payload);
  return { id: docRef.id, ...payload };
}

/**
 * Update a portfolio item
 */
export async function updatePortfolioItem(id: string, updates: Partial<ServerPortfolioItem>): Promise<ServerPortfolioItem | null> {
  const docRef = doc(db, 'portfolio', id);
  const snap = await getDoc(docRef);

  const payload = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (snap.exists()) {
    await updateDoc(docRef, payload);
    return { id, ...(snap.data() as any), ...payload };
  } else {
    // If updating a seeded item that wasn't yet persisted as this doc ID
    await setDoc(docRef, {
      ...payload,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return { id, ...(payload as any) };
  }
}

/**
 * Delete a portfolio item with guaranteed backend execution
 */
export async function deletePortfolioItem(id: string): Promise<{ success: boolean; deletedId: string; error?: string }> {
  try {
    if (!id) {
      return { success: false, deletedId: id, error: 'Missing portfolio item ID' };
    }

    const docRef = doc(db, 'portfolio', id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      await deleteDoc(docRef);
      console.log(`[portfolioService] Successfully deleted portfolio item ${id}`);
    } else {
      console.warn(`[portfolioService] Item ${id} not found in Firestore, deleting directly.`);
      await deleteDoc(docRef).catch(() => {});
    }

    return { success: true, deletedId: id };
  } catch (err: any) {
    console.error(`[portfolioService] Failed to delete portfolio item ${id}:`, err);
    return { success: false, deletedId: id, error: err.message };
  }
}

/**
 * Batch reorder portfolio items
 */
export async function reorderPortfolioItems(orders: { id: string; order: number }[]): Promise<boolean> {
  try {
    for (const item of orders) {
      if (item.id) {
        const docRef = doc(db, 'portfolio', item.id);
        await updateDoc(docRef, { order: item.order, updatedAt: new Date().toISOString() });
      }
    }
    return true;
  } catch (err) {
    console.error('[portfolioService] Error reordering items:', err);
    return false;
  }
}

/**
 * Media Library: Get all assets
 */
export async function getMediaAssets(): Promise<MediaAsset[]> {
  try {
    const q = query(collection(db, 'mediaLibrary'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }

    // Default seeded assets from studio showcase
    const defaultAssets: MediaAsset[] = [
      {
        id: 'med_1',
        title: 'Editorial Royal Bride & Groom',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        section: 'portfolio',
        category: 'Wedding',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_2',
        title: 'Heritage Temple Couple Golden Hour',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        section: 'hero',
        category: 'Pre-Wedding',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_3',
        title: 'Studio High Fashion Portrait',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
        section: 'services',
        category: 'Fashion',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_4',
        title: 'Ethereal Maternity Bloom',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        section: 'services',
        category: 'Maternity',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med_5',
        title: 'Chennai Studio Equipment & Atmosphere',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
        section: 'about',
        category: 'Studio',
        createdAt: new Date().toISOString(),
      },
    ];

    return defaultAssets;
  } catch (err) {
    console.error('[portfolioService] Error fetching media library assets:', err);
    return [];
  }
}

/**
 * Media Library: Add asset
 */
export async function addMediaAsset(asset: Omit<MediaAsset, 'id'>): Promise<MediaAsset> {
  const now = new Date().toISOString();
  const payload = {
    ...asset,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, 'mediaLibrary'), payload);
  return { id: docRef.id, ...payload };
}

/**
 * Media Library: Delete asset
 */
export async function deleteMediaAsset(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'mediaLibrary', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('[portfolioService] Error deleting media asset:', err);
    return false;
  }
}
