import React, { useState, useEffect } from 'react';
import {
  Camera,
  Link,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  Send,
  Trash2,
  Plus,
  Heart,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Unlock,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { Booking, Gallery, GalleryPhoto } from '../../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  getGalleryByBookingId,
  generateGalleryLink,
  revokeGalleryLink,
  updateGalleryPhotos,
  dispatchGalleryLink,
  calculateExpirationDate
} from '../../services/galleryService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface AdminGalleryManagerProps {
  booking: Booking;
  docId: string;
}

export const AdminGalleryManager: React.FC<AdminGalleryManagerProps> = ({ booking, docId }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Generation options
  const [expirationPeriod, setExpirationPeriod] = useState<'24h' | '3d' | '7d' | '30d' | 'custom'>('7d');
  const [customDays, setCustomDays] = useState<number>(14);

  // New photo state
  const [showAddPhoto, setShowAddPhoto] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoTitle, setPhotoTitle] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<string>('Highlights');
  const [photoCaption, setPhotoCaption] = useState<string>('');

  // Reorder & filter states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState<boolean>(false);

  // Real-time listener for gallery for this booking
  useEffect(() => {
    if (!booking.bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'galleries'), where('bookingId', '==', booking.bookingId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setGallery({
            id: docSnap.id,
            ...(docSnap.data() as any),
          });
        } else {
          setGallery(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to gallery:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [booking.bookingId]);

  // Gallery URL
  const galleryUrl = gallery?.secureToken
    ? `${window.location.origin}/gallery/${gallery.secureToken}`
    : '';

  const handleCopyLink = () => {
    if (!galleryUrl) return;
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    showSuccess('Private gallery link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate / Regenerate Gallery Link
  const handleGenerateLink = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const res = await generateGalleryLink({
        bookingId: booking.bookingId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        service: booking.service,
        expirationPeriod,
        customDays: expirationPeriod === 'custom' ? customDays : undefined,
        adminUser: { uid: user.uid, email: user.email },
      });

      if (res.success && res.gallery) {
        setGallery(res.gallery);
        showSuccess(`Private client gallery link generated! Valid until ${new Date(res.gallery.expiresAt).toLocaleDateString()}.`);
      } else {
        showError(res.error || 'Failed to generate gallery link');
      }
    } catch (err: any) {
      showError(err.message || 'Error generating link');
    } finally {
      setProcessing(false);
    }
  };

  // Revoke Link
  const handleRevokeLink = async () => {
    if (!gallery || !gallery.id || !user) return;
    if (!window.confirm('Are you sure you want to revoke this gallery link? The client will immediately lose access.')) {
      return;
    }

    setProcessing(true);
    try {
      const res = await revokeGalleryLink(gallery.id, booking.bookingId, { uid: user.uid, email: user.email });
      if (res.success) {
        setGallery((prev) => (prev ? { ...prev, active: false } : null));
        showSuccess('Gallery link revoked successfully.');
      } else {
        showError(res.error || 'Failed to revoke gallery');
      }
    } catch (err: any) {
      showError(err.message || 'Error revoking link');
    } finally {
      setProcessing(false);
    }
  };

  // Extend Expiration (+7 days)
  const handleExtendExpiration = async () => {
    if (!gallery || !gallery.id || !user) return;
    setProcessing(true);
    try {
      const currentExp = new Date(gallery.expiresAt > new Date().toISOString() ? gallery.expiresAt : new Date());
      currentExp.setDate(currentExp.getDate() + 7);
      const newExpiresAt = currentExp.toISOString();

      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      await updateDoc(doc(db, 'galleries', gallery.id), {
        expiresAt: newExpiresAt,
        active: true,
      });

      setGallery((prev) => (prev ? { ...prev, expiresAt: newExpiresAt, active: true } : null));
      showSuccess(`Gallery expiration extended by 7 days to ${new Date(newExpiresAt).toLocaleDateString()}.`);
    } catch (err: any) {
      showError(err.message || 'Failed to extend expiration');
    } finally {
      setProcessing(false);
    }
  };

  // Dispatch Link via Email & WhatsApp
  const handleDispatchLink = async () => {
    if (!gallery?.secureToken) {
      showError('Please generate an active gallery link first.');
      return;
    }

    setProcessing(true);
    try {
      const res = await dispatchGalleryLink({
        bookingId: booking.bookingId,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        secureToken: gallery.secureToken,
        expiresAt: gallery.expiresAt,
      });

      if (res.emailStatus === 'not_configured' && res.whatsappStatus === 'not_configured') {
        showInfo('Gallery link recorded! Note: Email and WhatsApp providers are NOT CONFIGURED in environment variables.');
      } else if (res.success) {
        showSuccess('Gallery notification dispatched to patron via Email & WhatsApp!');
      } else {
        showError(res.error || 'Notification dispatch encountered an issue. Check logs.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to dispatch notifications');
    } finally {
      setProcessing(false);
    }
  };

  // Add Photo to Gallery
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gallery || !gallery.id) return;
    if (!photoUrl.trim()) {
      showError('Please provide a valid image URL');
      return;
    }

    setProcessing(true);
    try {
      const newPhoto: GalleryPhoto = {
        id: 'img_' + Math.random().toString(36).substring(2, 9),
        url: photoUrl.trim(),
        title: photoTitle.trim() || `Shoot Capture #${(gallery.photos?.length || 0) + 1}`,
        caption: photoCaption.trim(),
        category: photoCategory || 'Highlights',
        order: (gallery.photos?.length || 0) + 1,
        uploadedAt: new Date().toISOString(),
        favorite: false,
        visible: true,
      };

      const updatedPhotos = [...(gallery.photos || []), newPhoto];
      const res = await updateGalleryPhotos(gallery.id, updatedPhotos);

      if (res.success) {
        setGallery((prev) => (prev ? { ...prev, photos: updatedPhotos } : null));
        setPhotoUrl('');
        setPhotoTitle('');
        setPhotoCaption('');
        setShowAddPhoto(false);
        showSuccess('Photo added to gallery!');
      } else {
        showError(res.error || 'Failed to add photo');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding photo');
    } finally {
      setProcessing(false);
    }
  };

  // Delete Photo from Gallery
  const handleDeletePhoto = async (photoId: string) => {
    if (!gallery || !gallery.id) return;
    if (!window.confirm('Are you sure you want to remove this photo from the client gallery?')) {
      return;
    }

    setProcessing(true);
    try {
      const updatedPhotos = (gallery.photos || []).filter((p) => p.id !== photoId);
      const res = await updateGalleryPhotos(gallery.id, updatedPhotos);
      if (res.success) {
        setGallery((prev) => (prev ? { ...prev, photos: updatedPhotos } : null));
        showSuccess('Photo removed from gallery.');
      } else {
        showError(res.error || 'Failed to delete photo');
      }
    } catch (err: any) {
      showError(err.message || 'Error deleting photo');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle Photo Visibility
  const handleToggleVisibility = async (photoId: string) => {
    if (!gallery || !gallery.id) return;
    const updatedPhotos = (gallery.photos || []).map((p) => {
      if (p.id === photoId) {
        return { ...p, visible: p.visible === false ? true : false };
      }
      return p;
    });

    try {
      await updateGalleryPhotos(gallery.id, updatedPhotos);
      setGallery((prev) => (prev ? { ...prev, photos: updatedPhotos } : null));
    } catch (err: any) {
      showError(err.message || 'Failed to toggle photo visibility');
    }
  };

  // Drag-and-Drop Reordering Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !gallery || !gallery.id) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const currentPhotos = [...(gallery.photos || [])];
    const [movedItem] = currentPhotos.splice(draggedIndex, 1);
    currentPhotos.splice(dropIndex, 0, movedItem);

    // Re-assign sequence order property
    const reordered = currentPhotos.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setGallery((prev) => (prev ? { ...prev, photos: reordered } : null));
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      const res = await updateGalleryPhotos(gallery.id, reordered);
      if (res.success) {
        showSuccess('Photo sequence updated and saved!');
      } else {
        showError(res.error || 'Failed to save reordered photos');
      }
    } catch (err: any) {
      showError(err.message || 'Error updating photo order');
    }
  };

  // One-click Move Left/Right Reordering
  const handleMovePhoto = async (index: number, direction: -1 | 1) => {
    if (!gallery || !gallery.id || !gallery.photos) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gallery.photos.length) return;

    const currentPhotos = [...gallery.photos];
    const [movedItem] = currentPhotos.splice(index, 1);
    currentPhotos.splice(targetIndex, 0, movedItem);

    const reordered = currentPhotos.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setGallery((prev) => (prev ? { ...prev, photos: reordered } : null));

    try {
      const res = await updateGalleryPhotos(gallery.id, reordered);
      if (res.success) {
        showSuccess('Photo position updated!');
      } else {
        showError(res.error || 'Failed to update photo sequence');
      }
    } catch (err: any) {
      showError(err.message || 'Error saving photo sequence');
    }
  };

  // Add Curated Sample Showcase Photos
  const handleLoadSamplePhotos = async () => {
    if (!gallery || !gallery.id) return;
    setProcessing(true);
    try {
      const samples: GalleryPhoto[] = [
        {
          id: 'samp_1',
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop',
          title: 'Royal Mandap Sacred Rituals',
          caption: 'Golden hour pheras and floral garland vows',
          category: 'Ceremony',
          order: 1,
          uploadedAt: new Date().toISOString(),
          favorite: true,
          visible: true,
        },
        {
          id: 'samp_2',
          url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1600&auto=format&fit=crop',
          title: 'Heirloom Heritage Portrait',
          caption: 'Bridal velvet embroidery and heirloom jewels in ambient studio glow',
          category: 'Portraits',
          order: 2,
          uploadedAt: new Date().toISOString(),
          favorite: true,
          visible: true,
        },
        {
          id: 'samp_3',
          url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1600&auto=format&fit=crop',
          title: 'First Twilight Dance',
          caption: 'Ambient sparklers and celebratory laughter',
          category: 'Reception',
          order: 3,
          uploadedAt: new Date().toISOString(),
          favorite: false,
          visible: true,
        },
        {
          id: 'samp_4',
          url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1600&auto=format&fit=crop',
          title: 'Intimate Sunset Stroll',
          caption: 'Quiet unscripted moments by the courtyard lake',
          category: 'Highlights',
          order: 4,
          uploadedAt: new Date().toISOString(),
          favorite: false,
          visible: true,
        },
      ];

      const res = await updateGalleryPhotos(gallery.id, samples);
      if (res.success) {
        setGallery((prev) => (prev ? { ...prev, photos: samples } : null));
        showSuccess('Curated high-res showcase photos loaded into client vault!');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load sample photos');
    } finally {
      setProcessing(false);
    }
  };

  const isExpired = gallery ? new Date() > new Date(gallery.expiresAt) : false;
  const isRevoked = gallery ? !gallery.active : false;
  const isAvailable = gallery && gallery.active && !isExpired;

  const favoriteCount = (gallery?.photos || []).filter((p) => p.favorite).length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Private Client Photo Gallery &amp; Delivery System
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate secure, time-limited gallery links for {booking.clientName}. Allows high-res downloads, watermarks, and album selections.
          </p>
        </div>

        {gallery && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                isAvailable
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : isRevoked
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE &amp; LIVE'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
          Loading gallery data...
        </div>
      ) : !gallery ? (
        /* Empty State: Create & Configure Gallery */
        <div className="p-6 rounded-xl bg-slate-950/70 border border-slate-800 space-y-5 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No Active Gallery for this Booking</h4>
            <p className="text-xs text-slate-400">
              Configure a secure, time-limited gallery link to deliver high-resolution photos to {booking.clientName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Link Expiration Window:
              </label>
              <select
                value={expirationPeriod}
                onChange={(e: any) => setExpirationPeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="24h">24 Hours (Quick review)</option>
                <option value="3d">3 Days (Standard delivery)</option>
                <option value="7d">7 Days (Recommended)</option>
                <option value="30d">30 Days (Extended vault)</option>
                <option value="custom">Custom Duration (Days)</option>
              </select>
            </div>

            {expirationPeriod === 'custom' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Custom Days:
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={handleGenerateLink}
            className="py-2.5 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition shadow-lg"
          >
            <Camera className="w-4 h-4" />
            <span>Generate &amp; Activate Client Gallery</span>
          </button>
        </div>
      ) : (
        /* Gallery Active / Management State */
        <div className="space-y-6">
          {/* Security & Link Card */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Link className="w-4 h-4 text-amber-400" />
                <span>Secure Client Access URL (Unguessable Token):</span>
              </div>

              <div className="text-xs text-slate-400">
                Expires: <span className="font-semibold text-slate-200">{new Date(gallery.expiresAt).toLocaleDateString()} at {new Date(gallery.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* URL bar with Copy and Open */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={galleryUrl}
                className="w-full px-3 py-2.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Copy Gallery Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`/gallery/${gallery.secureToken}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Open Gallery in New Tab"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Preview</span>
              </a>
            </div>

            {/* Action Bar (Send Notifications, Extend, Revoke) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={processing || !isAvailable}
                  onClick={handleDispatchLink}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Link via Email &amp; WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleExtendExpiration}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Extend Expiration (+7 Days)</span>
                </button>
              </div>

              <div>
                {gallery.active ? (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleRevokeLink}
                    className="px-3.5 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Revoke Gallery Access</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleGenerateLink}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Re-activate Gallery</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Photo Vault Header & Album Selections Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Client Vault Photos ({(gallery.photos || []).length})</span>
              </h4>

              {favoriteCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    filterFavoritesOnly
                      ? 'bg-rose-500 text-white border-rose-400 shadow'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900/60'
                  }`}
                  title="Filter to only show photos client selected for their photo album"
                >
                  <Heart className={`w-3 h-3 ${filterFavoritesOnly ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
                  <span>{favoriteCount} Selected for Album {filterFavoritesOnly ? '✓' : ''}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(gallery.photos || []).length === 0 && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleLoadSamplePhotos}
                  className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-medium cursor-pointer transition"
                >
                  Load Curated Showcase Photos
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>{showAddPhoto ? 'Close Form' : 'Upload / Add Photo'}</span>
              </button>
            </div>
          </div>

          {/* Photo Reorder Guide */}
          {(gallery.photos || []).length > 1 && !filterFavoritesOnly && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Reorder Sequence:</span>
              </span>
              <span>Drag &amp; drop cards to reorder, or use the ◀ / ▶ arrows on hover. New sequence saves automatically.</span>
            </div>
          )}

          {/* Add Photo Collapsible Form */}
          {showAddPhoto && (
            <form onSubmit={handleAddPhoto} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Add Photography Asset to Client Vault
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Highlights">Highlights</option>
                    <option value="Ceremony">Ceremony</option>
                    <option value="Reception">Reception</option>
                    <option value="Portraits">Portraits</option>
                    <option value="Candid">Candid</option>
                    <option value="Final Selection">Final Selection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Photo Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Entrance &amp; Garlands"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Caption / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Taken during evening golden hour"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhoto(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {processing ? 'Uploading...' : 'Save Photo to Gallery'}
                </button>
              </div>
            </form>
          )}

          {/* Photos Grid */}
          {(gallery.photos || []).length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <Camera className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No photos in this gallery yet.</p>
              <p className="text-[11px] text-slate-500">
                Click &ldquo;Upload / Add Photo&rdquo; or &ldquo;Load Curated Showcase Photos&rdquo; to populate the client vault.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(gallery.photos || [])
                .filter((p) => (!filterFavoritesOnly ? true : Boolean(p.favorite)))
                .map((photo, index) => {
                  const actualIndex = (gallery.photos || []).findIndex((p) => p.id === photo.id);
                  const isFirst = actualIndex === 0;
                  const isLast = actualIndex === (gallery.photos || []).length - 1;
                  const isDragOver = dragOverIndex === actualIndex;
                  const isDragging = draggedIndex === actualIndex;

                  return (
                    <div
                      key={photo.id}
                      draggable={!filterFavoritesOnly}
                      onDragStart={(e) => handleDragStart(e, actualIndex)}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      className={`group relative rounded-xl border overflow-hidden bg-slate-950/80 transition-all duration-200 ${
                        isDragging ? 'opacity-40 scale-95 border-amber-400' : ''
                      } ${
                        isDragOver ? 'ring-2 ring-amber-400 scale-[1.02] border-amber-400' : ''
                      } ${
                        photo.visible === false ? 'opacity-50 border-slate-800' : 'border-slate-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden relative">
                        <img
                          src={photo.url}
                          alt={photo.title || 'Studio photograph'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          loading="lazy"
                        />

                        {/* Sequence badge & drag handle */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                            #{photo.order || actualIndex + 1}
                          </span>
                          {!filterFavoritesOnly && (
                            <span className="p-1 rounded bg-black/70 backdrop-blur-sm text-neutral-400 cursor-grab active:cursor-grabbing hover:text-white" title="Drag to reorder">
                              <GripVertical className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* Category pill */}
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-semibold text-slate-300 border border-slate-800">
                          {photo.category || 'Highlights'}
                        </span>

                        {/* Favorite badge */}
                        {photo.favorite && (
                          <span className="absolute top-2 right-2 p-1 rounded-full bg-rose-600/90 text-white shadow" title="Selected by client for album">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}

                        {/* Controls Overlay on hover */}
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          {/* Move Left / Right Buttons */}
                          {!filterFavoritesOnly && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMovePhoto(actualIndex, -1)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                title="Move photo backward"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] text-neutral-400 font-mono">Move</span>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMovePhoto(actualIndex, 1)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                title="Move photo forward"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(photo.id)}
                              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
                              title={photo.visible === false ? 'Make visible to client' : 'Hide from client'}
                            >
                              {photo.visible === false ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 text-xs">
                        <div className="font-semibold text-slate-200 truncate" title={photo.title}>
                          {photo.title || 'Untitled Photo'}
                        </div>
                        {photo.caption && (
                          <p className="text-[11px] text-slate-500 truncate">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
