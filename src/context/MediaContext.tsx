import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MediaItem } from '../types';
import { INITIAL_MEDIA_LIBRARY, WEBSITE_IMAGE_SLOTS } from '../data/mediaDefaults';

interface MediaUsageReport {
  isUsed: boolean;
  usages: string[];
}

interface MediaContextType {
  mediaList: MediaItem[];
  loading: boolean;
  getMediaUrl: (slot: string, fallbackUrl?: string) => string;
  getMediaAlt: (slot: string, fallbackAlt?: string) => string;
  getMediaItem: (slotOrId: string) => MediaItem | undefined;
  addMedia: (item: Omit<MediaItem, 'id'>) => Promise<string>;
  updateMedia: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  replaceMedia: (id: string, newUrl: string, title?: string, newSlot?: string) => Promise<void>;
  assignMediaSlot: (mediaId: string, targetSlot: string) => Promise<void>;
  deleteMedia: (id: string, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  toggleMediaVisibility: (id: string) => Promise<void>;
  checkMediaUsage: (item: MediaItem) => MediaUsageReport;
}

const MediaContext = createContext<MediaContextType>({
  mediaList: INITIAL_MEDIA_LIBRARY,
  loading: true,
  getMediaUrl: () => '',
  getMediaAlt: () => '',
  getMediaItem: () => undefined,
  addMedia: async () => '',
  updateMedia: async () => {},
  replaceMedia: async () => {},
  assignMediaSlot: async () => {},
  deleteMedia: async () => ({ success: false }),
  toggleMediaVisibility: async () => {},
  checkMediaUsage: () => ({ isUsed: false, usages: [] }),
});

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    try {
      const cached = localStorage.getItem('studio_media_library');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_MEDIA_LIBRARY to ensure all 7 categories and new fields are available
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missingDefaults = INITIAL_MEDIA_LIBRARY.filter((def) => !existingIds.has(def.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (e) {}
    return INITIAL_MEDIA_LIBRARY;
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Real-time Firestore sync
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      const q = query(collection(db, 'mediaLibrary'), orderBy('order', 'asc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const docs: MediaItem[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<MediaItem, 'id'>),
            }));
            setMediaList(docs);
            try {
              localStorage.setItem('studio_media_library', JSON.stringify(docs));
            } catch (e) {}
          } else {
            // First time load or empty collection in Firestore: seed defaults
            setMediaList(INITIAL_MEDIA_LIBRARY);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('[MediaContext] Firestore onSnapshot warning, keeping cached seeds:', err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('[MediaContext] Listener initialization error:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Quick slot map for O(1) lookup
  const slotMap = useMemo(() => {
    const map = new Map<string, MediaItem>();
    for (const item of mediaList) {
      if (item.slot) {
        // If multiple items share a slot, the visible one takes precedence
        if (!map.has(item.slot) || item.visible) {
          map.set(item.slot, item);
        }
      }
    }
    return map;
  }, [mediaList]);

  // ID map
  const idMap = useMemo(() => {
    const map = new Map<string, MediaItem>();
    for (const item of mediaList) {
      map.set(item.id, item);
    }
    return map;
  }, [mediaList]);

  const getMediaItem = (slotOrId: string): MediaItem | undefined => {
    if (slotMap.has(slotOrId)) {
      return slotMap.get(slotOrId);
    }
    return idMap.get(slotOrId);
  };

  const getMediaUrl = (slot: string, fallbackUrl?: string): string => {
    const item = slotMap.get(slot);
    if (item && item.visible !== false && item.url) {
      return item.url;
    }
    if (fallbackUrl) return fallbackUrl;
    const defaultDef = WEBSITE_IMAGE_SLOTS.find((s) => s.slot === slot);
    return defaultDef?.defaultUrl || '';
  };

  const getMediaAlt = (slot: string, fallbackAlt?: string): string => {
    const item = slotMap.get(slot);
    if (item && item.alt) {
      return item.alt;
    }
    if (fallbackAlt) return fallbackAlt;
    const defaultDef = WEBSITE_IMAGE_SLOTS.find((s) => s.slot === slot);
    return defaultDef?.defaultAlt || '1 by 2 Studio Photography';
  };

  const checkMediaUsage = (item: MediaItem): MediaUsageReport => {
    const usages: string[] = [];

    // 1. Check if item has a specific website slot assigned
    if (item.slot) {
      const slotDef = WEBSITE_IMAGE_SLOTS.find((s) => s.slot === item.slot);
      if (slotDef) {
        usages.push(`${slotDef.name} (${slotDef.page} page)`);
      } else {
        usages.push(`Assigned to slot: ${item.slot}`);
      }
    }

    // 2. Check if item's URL is currently used by any defined slot
    const matchesSlotUrl = WEBSITE_IMAGE_SLOTS.filter(
      (s) => s.defaultUrl === item.url && s.slot !== item.slot
    );
    for (const s of matchesSlotUrl) {
      usages.push(`Matches standard URL for ${s.name}`);
    }

    // 3. Usage label tag
    if (item.usageLabel && !usages.includes(item.usageLabel)) {
      usages.push(item.usageLabel);
    }

    // 4. Client section definition
    if (item.clientSection && !usages.some((u) => u.includes(item.clientSection!))) {
      usages.push(`Client Site: ${item.clientSection}`);
    }

    return {
      isUsed: usages.length > 0 || item.activeOnSite === true,
      usages,
    };
  };

  const addMedia = async (itemData: Omit<MediaItem, 'id'>): Promise<string> => {
    const now = new Date().toISOString();
    const payload = {
      ...itemData,
      visible: itemData.visible !== false,
      order: itemData.order || mediaList.length + 1,
      createdAt: now,
      updatedAt: now,
      uploadedAt: itemData.uploadedAt || now,
    };

    try {
      const docRef = await addDoc(collection(db, 'mediaLibrary'), payload);
      const newItem: MediaItem = { id: docRef.id, ...payload };
      setMediaList((prev) => [newItem, ...prev]);
      return docRef.id;
    } catch (err: any) {
      console.warn('Firestore addDoc failed, generating local ID:', err.message);
      const localId = `media-${Date.now()}`;
      const newItem: MediaItem = { id: localId, ...payload };
      setMediaList((prev) => [newItem, ...prev]);
      return localId;
    }
  };

  const updateMedia = async (id: string, updates: Partial<MediaItem>): Promise<void> => {
    const now = new Date().toISOString();
    const payload = {
      ...updates,
      updatedAt: now,
    };

    setMediaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...payload } : item))
    );

    try {
      const docRef = doc(db, 'mediaLibrary', id);
      await setDoc(docRef, payload, { merge: true });
    } catch (err: any) {
      console.warn('Firestore updateDoc warning:', err.message);
    }
  };

  const replaceMedia = async (
    id: string,
    newUrl: string,
    title?: string,
    newSlot?: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    const updates: Partial<MediaItem> = {
      url: newUrl.trim(),
      updatedAt: now,
      ...(title ? { title: title.trim() } : {}),
      ...(newSlot !== undefined ? { slot: newSlot.trim() } : {}),
    };

    await updateMedia(id, updates);
  };

  const assignMediaSlot = async (mediaId: string, targetSlot: string): Promise<void> => {
    // If another media was previously occupying targetSlot, unassign it
    for (const m of mediaList) {
      if (m.slot === targetSlot && m.id !== mediaId) {
        await updateMedia(m.id, { slot: '' });
      }
    }
    // Assign to new item
    await updateMedia(mediaId, { slot: targetSlot });
  };

  const toggleMediaVisibility = async (id: string): Promise<void> => {
    const item = mediaList.find((m) => m.id === id);
    if (!item) return;
    const newVis = !item.visible;
    await updateMedia(id, { visible: newVis });
  };

  const deleteMedia = async (
    id: string,
    force = false
  ): Promise<{ success: boolean; error?: string }> => {
    const target = mediaList.find((m) => m.id === id);
    if (!target) return { success: false, error: 'Image not found' };

    // Safety check: Is this image currently bound to an active website slot?
    if (target.slot && !force) {
      const slotDef = WEBSITE_IMAGE_SLOTS.find((s) => s.slot === target.slot);
      return {
        success: false,
        error: `Cannot delete image because it is currently assigned to public website slot "${slotDef?.name || target.slot}". Please replace the slot image or unassign it first.`,
      };
    }

    setMediaList((prev) => prev.filter((m) => m.id !== id));

    try {
      const docRef = doc(db, 'mediaLibrary', id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err: any) {
      console.warn('Firestore deleteDoc warning:', err.message);
      return { success: true };
    }
  };

  return (
    <MediaContext.Provider
      value={{
        mediaList,
        loading,
        getMediaUrl,
        getMediaAlt,
        getMediaItem,
        addMedia,
        updateMedia,
        replaceMedia,
        assignMediaSlot,
        deleteMedia,
        toggleMediaVisibility,
        checkMediaUsage,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => useContext(MediaContext);
