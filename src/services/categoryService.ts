import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CategoryItem } from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaults';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat_wedding',
    name: 'Weddings',
    slug: 'weddings',
    parentId: 'photography',
    subcategories: ['Traditional Wedding', 'Royal Mandap', 'Candid Moments', 'Reception'],
    order: 1,
    status: 'active',
  },
  {
    id: 'cat_couple',
    name: 'Couples',
    slug: 'couples',
    parentId: 'photography',
    subcategories: ['Pre-Wedding', 'Beach Romance', 'Heritage Temple', 'Sunset Stroll'],
    order: 2,
    status: 'active',
  },
  {
    id: 'cat_portrait',
    name: 'Portraits',
    slug: 'portraits',
    parentId: 'photography',
    subcategories: ['Editorial Portrait', 'Fine-Art Studio', 'Executive', 'Monochrome'],
    order: 3,
    status: 'active',
  },
  {
    id: 'cat_fashion',
    name: 'Fashion',
    slug: 'fashion',
    parentId: 'photography',
    subcategories: ['Haute Couture Silk', 'Editorial Lookbook', 'Contemporary'],
    order: 4,
    status: 'active',
  },
  {
    id: 'cat_events',
    name: 'Events',
    slug: 'events',
    parentId: 'photography',
    subcategories: ['Gala & Sangeet', 'Private Celebration', 'Cultural Milestone'],
    order: 5,
    status: 'active',
  },
  {
    id: 'cat_commercial',
    name: 'Commercial',
    slug: 'commercial',
    parentId: 'photography',
    subcategories: ['Architectural', 'Artisan & Craft', 'Brand Campaign'],
    order: 6,
    status: 'active',
  },
];

/**
 * Normalizes category name for clean comparisons
 */
export function normalizeCategoryName(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/s$/, ''); // e.g. "Weddings" -> "wedding"
}

/**
 * Fetches all categories, seeding defaults if empty
 */
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CategoryItem) }));
    }

    // Check portfolioCategories as fallback
    const qPort = query(collection(db, 'portfolioCategories'), orderBy('order', 'asc'));
    const snapPort = await getDocs(qPort);
    if (!snapPort.empty) {
      const list: CategoryItem[] = snapPort.docs
        .filter((d) => d.id !== 'cat_all')
        .map((d, idx) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
            order: data.order || idx + 1,
            status: 'active',
            subcategories: [],
          };
        });
      return list;
    }

    // Fallback to in-memory initial categories without attempting write side-effects on read
    return INITIAL_CATEGORIES;
  } catch (err) {
    console.warn('[categoryService] Falling back to default categories:', err);
    return INITIAL_CATEGORIES;
  }
}

/**
 * Seeds initial categories to Firestore if empty and user is an authenticated admin
 */
export async function seedCategoriesIfEmpty(): Promise<void> {
  // Only proceed if authenticated to avoid security rule rejections and queued write exhaustion
  if (!auth.currentUser) {
    return;
  }
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id!), {
          ...cat,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[categoryService] Seed failed:', err);
  }
}

/**
 * Subscribes to real-time category updates
 */
export function subscribeCategories(callback: (categories: CategoryItem[]) => void): () => void {
  const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as CategoryItem) })));
      } else {
        callback(INITIAL_CATEGORIES);
      }
    },
    (err) => {
      console.warn('[categoryService] onSnapshot listener warning:', err);
      callback(INITIAL_CATEGORIES);
    }
  );
}

/**
 * Creates a new category
 */
export async function createCategory(cat: Omit<CategoryItem, 'id'>): Promise<CategoryItem> {
  const now = new Date().toISOString();
  const slug = cat.slug || cat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const catId = `cat_${slug}_${Date.now().toString().slice(-4)}`;

  const payload: CategoryItem = {
    ...cat,
    id: catId,
    slug,
    status: cat.status || 'active',
    subcategories: cat.subcategories || [],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'categories', catId), payload);

  // Sync to portfolioCategories for backward compatibility
  try {
    await setDoc(doc(db, 'portfolioCategories', catId), {
      name: cat.name,
      slug,
      order: cat.order || 99,
    });
  } catch (e) {}

  return payload;
}

/**
 * Updates a category and cascades changes to media and portfolio items
 * Prevents orphaning existing media!
 */
export async function updateCategory(
  id: string,
  updates: Partial<CategoryItem>,
  oldCategoryName?: string
): Promise<void> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'categories', id);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: now,
  });

  // Also sync to portfolioCategories
  try {
    const portDocRef = doc(db, 'portfolioCategories', id);
    await setDoc(portDocRef, {
      name: updates.name,
      slug: updates.slug,
      order: updates.order,
    }, { merge: true });
  } catch (e) {}

  // If the category name changed, cascade update to all media and portfolio items
  if (oldCategoryName && updates.name && oldCategoryName !== updates.name) {
    try {
      // 1. Update mediaLibrary
      const mediaSnap = await getDocs(collection(db, 'mediaLibrary'));
      const batch = writeBatch(db);
      let batchCount = 0;

      mediaSnap.forEach((d) => {
        const m = d.data();
        if (m.category && m.category.toLowerCase() === oldCategoryName.toLowerCase()) {
          batch.update(d.ref, { category: updates.name, updatedAt: now });
          batchCount++;
        }
      });

      // 2. Update portfolio collection
      const portSnap = await getDocs(collection(db, 'portfolio'));
      portSnap.forEach((d) => {
        const p = d.data();
        if (p.category && p.category.toLowerCase() === oldCategoryName.toLowerCase()) {
          batch.update(d.ref, { category: updates.name, updatedAt: now });
          batchCount++;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
      }
    } catch (cascadeErr) {
      console.warn('[categoryService] Cascade update error:', cascadeErr);
    }
  }
}

/**
 * Deletes a category safely.
 * If media or portfolio items use this category, reassigns them to fallbackCategory so nothing is orphaned!
 */
export async function deleteCategory(id: string, categoryName: string, fallbackCategory = 'General'): Promise<void> {
  // 1. Reassign any media or portfolio items using this category
  try {
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    let batchCount = 0;

    const mediaSnap = await getDocs(collection(db, 'mediaLibrary'));
    mediaSnap.forEach((d) => {
      const m = d.data();
      if (m.category && m.category.toLowerCase() === categoryName.toLowerCase()) {
        batch.update(d.ref, { category: fallbackCategory, updatedAt: now });
        batchCount++;
      }
    });

    const portSnap = await getDocs(collection(db, 'portfolio'));
    portSnap.forEach((d) => {
      const p = d.data();
      if (p.category && p.category.toLowerCase() === categoryName.toLowerCase()) {
        batch.update(d.ref, { category: fallbackCategory, updatedAt: now });
        batchCount++;
      }
    });

    if (batchCount > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.warn('[categoryService] Reassignment before deletion failed:', e);
  }

  // 2. Delete the category documents
  await deleteDoc(doc(db, 'categories', id));
  try {
    await deleteDoc(doc(db, 'portfolioCategories', id));
  } catch (e) {}
}
