import React, { useState, useEffect, useMemo } from 'react';
import { getGalleryByToken, updateGalleryPhotos } from '../services/galleryService';
import { Gallery, GalleryPhoto } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Camera, 
  Calendar, 
  Clock, 
  Download, 
  Eye, 
  Share2, 
  Phone, 
  AlertCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Check,
  Heart,
  SlidersHorizontal,
  Stamp,
  BookOpen
} from 'lucide-react';

interface ClientGalleryProps {
  token: string;
  onNavigate: (page: string) => void;
}

export const ClientGallery: React.FC<ClientGalleryProps> = ({ token, onNavigate }) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'revoked' | 'not_found'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Category filter & selection filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);

  // Lightbox state
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    async function loadGallery() {
      if (!token) {
        setStatus('not_found');
        setErrorMessage('Invalid or missing gallery link.');
        return;
      }

      setStatus('loading');
      const result = await getGalleryByToken(token);
      setStatus(result.status);
      if (result.status === 'valid' && result.gallery) {
        setGallery(result.gallery);
      } else {
        setErrorMessage(result.error || 'Gallery could not be loaded.');
      }
    }

    loadGallery();
  }, [token]);

  const photos = gallery?.photos || [];

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    photos.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [photos]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (showOnlyFavorites && !p.favorite) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      return true;
    });
  }, [photos, selectedCategory, showOnlyFavorites]);

  const favoriteCount = useMemo(() => {
    return photos.filter((p) => p.favorite).length;
  }, [photos]);

  // Toggle favorite for album selection
  const handleToggleFavorite = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!gallery || !gallery.id) return;

    const updated = photos.map((p) => {
      if (p.id === photoId) {
        const nextFav = !p.favorite;
        if (nextFav) {
          showSuccess(`"${p.title || 'Photo'}" marked for album selection!`);
        } else {
          showInfo(`Removed from album selection.`);
        }
        return { ...p, favorite: nextFav };
      }
      return p;
    });

    setGallery({ ...gallery, photos: updated });
    try {
      await updateGalleryPhotos(gallery.id, updated);
    } catch (err) {
      console.error('Failed to sync favorite:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showSuccess('Private gallery link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownload = (photo: GalleryPhoto) => {
    showInfo(`Downloading ${photo.title || 'photo'}...`);
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.title || '1by2-studio-photo'}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    if (!filteredPhotos.length) return;
    showSuccess(`Opening ${filteredPhotos.length} photos for download.`);
    filteredPhotos.forEach((p, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = p.url;
        a.download = `${gallery?.clientName || 'session'}-photo-${idx + 1}.jpg`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 300);
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold tracking-wider text-slate-200 uppercase">1 by 2 Studio</h2>
          <p className="text-slate-400 mt-2 text-sm">Securely decrypting and loading your private client vault...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired' || status === 'revoked' || status === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-red-950/50 border border-red-800/40 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {status === 'expired' ? 'Gallery Access Expired' : status === 'revoked' ? 'Gallery Link Revoked' : 'Gallery Not Found'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {errorMessage || (status === 'expired' 
              ? 'This private gallery link has expired in accordance with studio delivery retention policies.' 
              : 'This gallery link is no longer available or could not be found.')}
          </p>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 mb-6 text-left text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-200">Need assistance or access extension?</p>
            <p>Directly contact 1 by 2 Studio and quote your booking details to request re-activation:</p>
            <div className="pt-2 flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Phone className="w-4 h-4" />
              <span>80154 83954</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition cursor-pointer"
            >
              Back to Home
            </button>
            <a
              href="tel:8015483954"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-lg transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Call Studio
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) return null;

  const expirationDate = new Date(gallery.expiresAt);
  const now = new Date();
  const diffDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">1 BY 2 STUDIO</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Private Client Vault
                </span>
              </div>
              <p className="text-xs text-slate-400">Client: <span className="text-slate-200 font-medium">{gallery.clientName}</span> • {gallery.service}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Watermark Toggle */}
            <button
              type="button"
              onClick={() => setShowWatermark(!showWatermark)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition cursor-pointer ${
                showWatermark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'text-slate-400 bg-slate-800/80 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Studio Watermark Overlay"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>{showWatermark ? 'Watermark ON' : 'Watermark OFF'}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Copy private gallery link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Share'}
            </button>

            {photos.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ({filteredPhotos.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Expiration Notice Ribbon */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-300/90">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Time-limited private link. Expires on <strong>{expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> ({diffDays > 0 ? `${diffDays} days remaining` : 'Expiring today'}).
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span>Studio Phone:</span>
            <strong className="text-amber-400">80154 83954</strong>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Categories & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowOnlyFavorites(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat && !showOnlyFavorites
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Album Selection Pill */}
          <button
            type="button"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
              showOnlyFavorites
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-rose-500/50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites || favoriteCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>Album Selections ({favoriteCount})</span>
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 max-w-lg mx-auto">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Your Photos Are Being Curated</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              1 by 2 Studio is finishing post-processing on your high-resolution images. Check back shortly or contact the studio at 80154 83954.
            </p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">No photos in this category.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setShowOnlyFavorites(false); }}
              className="mt-3 text-xs text-amber-400 underline cursor-pointer"
            >
              Show all photos
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Displaying {filteredPhotos.length} of {photos.length} High-Res Photographs
              </h2>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Click heart on any photo to save for your printed album
              </span>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80 hover:border-amber-500/50 transition-all duration-300 shadow-md flex flex-col"
                >
                  <div
                    className="relative aspect-4/3 overflow-hidden cursor-pointer bg-slate-950"
                    onClick={() => setActivePhotoIndex(index)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title || `Photo ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Watermark Overlay if toggled */}
                    {showWatermark && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="text-white/25 font-bold tracking-widest text-lg uppercase rotate-[-25deg] select-none border-2 border-white/20 px-4 py-1">
                          1 BY 2 STUDIO
                        </div>
                      </div>
                    )}

                    {/* Category pill */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-semibold text-slate-300 border border-slate-800">
                      {photo.category || 'Highlights'}
                    </span>

                    {/* Heart Button for Album Selection */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(photo.id, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition shadow-md cursor-pointer ${
                        photo.favorite
                          ? 'bg-rose-600 text-white'
                          : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80'
                      }`}
                      title={photo.favorite ? 'Selected for album' : 'Click to select for album'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${photo.favorite ? 'fill-white' : ''}`} />
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3 pointer-events-none">
                      <span className="text-xs font-medium text-white truncate max-w-[70%]">
                        {photo.title || `Photo ${index + 1}`}
                      </span>
                      <div className="p-1.5 bg-black/60 rounded-full text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between border-t border-slate-800/60 bg-slate-900/80">
                    <span className="text-xs text-slate-400 truncate max-w-[140px]">
                      {photo.title || `Photo ${index + 1}`}
                    </span>
                    <button
                      onClick={() => handleDownload(photo)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Download high-resolution photo"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && filteredPhotos[activePhotoIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between">
          {/* Lightbox Topbar */}
          <div className="p-4 flex items-center justify-between text-white border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Photo {activePhotoIndex + 1} of {filteredPhotos.length}
              </span>
              <span className="text-sm font-medium text-slate-200">
                {filteredPhotos[activePhotoIndex].title || ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Heart toggle in lightbox */}
              <button
                type="button"
                onClick={() => handleToggleFavorite(filteredPhotos[activePhotoIndex].id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filteredPhotos[activePhotoIndex].favorite
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${filteredPhotos[activePhotoIndex].favorite ? 'fill-white' : ''}`} />
                <span>{filteredPhotos[activePhotoIndex].favorite ? 'Selected for Album' : 'Select for Album'}</span>
              </button>

              <button
                onClick={() => handleDownload(filteredPhotos[activePhotoIndex])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setActivePhotoIndex(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Active Photo Stage */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            {activePhotoIndex > 0 && (
              <button
                onClick={() => setActivePhotoIndex(activePhotoIndex - 1)}
                className="absolute left-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition border border-white/10 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative max-h-[80vh] max-w-[90vw]">
              <img
                src={filteredPhotos[activePhotoIndex].url}
                alt={filteredPhotos[activePhotoIndex].title || 'Photo view'}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all"
              />
              {showWatermark && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-white/20 font-bold tracking-widest text-2xl uppercase rotate-[-25deg] select-none border-2 border-white/20 px-6 py-2">
                    1 BY 2 STUDIO
                  </div>
                </div>
              )}
            </div>

            {activePhotoIndex < filteredPhotos.length - 1 && (
              <button
                onClick={() => setActivePhotoIndex(activePhotoIndex + 1)}
                className="absolute right-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition border border-white/10 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer */}
          <div className="p-4 text-center text-xs text-slate-400 border-t border-white/10 bg-black/50">
            1 by 2 Studio • Client Photography Deliverable • Direct Phone: 80154 83954
          </div>
        </div>
      )}
    </div>
  );
};
