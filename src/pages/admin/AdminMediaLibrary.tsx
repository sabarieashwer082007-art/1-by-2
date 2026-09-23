import React, { useState, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  Edit2,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Bookmark,
  Sparkles,
  LayoutGrid,
  List,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Globe,
  Tag,
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { useMedia } from '../../context/MediaContext';
import { MediaItem } from '../../types';
import { WEBSITE_IMAGE_SLOTS, MEDIA_CATEGORIES_CONFIG } from '../../data/mediaDefaults';

export const AdminMediaLibrary: React.FC = () => {
  const { design } = useStudio();
  const {
    mediaList,
    loading,
    addMedia,
    updateMedia,
    replaceMedia,
    assignMediaSlot,
    deleteMedia,
    toggleMediaVisibility,
    checkMediaUsage,
  } = useMedia();

  // View Mode: Grid vs List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedUsageFilter, setSelectedUsageFilter] = useState<'all' | 'active' | 'standalone' | 'hidden'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MediaItem | null>(null);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  // Full-size Preview Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Form states for Add / Edit / Replace
  const [formTitle, setFormTitle] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileType, setFormFileType] = useState('JPG');
  const [formFileSize, setFormFileSize] = useState('');
  const [formDimensions, setFormDimensions] = useState('');
  const [formFilePath, setFormFilePath] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAlt, setFormAlt] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Hero & Branding');
  const [formSubcategory, setFormSubcategory] = useState('Hero banner');
  const [formClientSection, setFormClientSection] = useState('');
  const [formAdminSection, setFormAdminSection] = useState('');
  const [formPage, setFormPage] = useState('home');
  const [formSection, setFormSection] = useState('hero');
  const [formSlot, setFormSlot] = useState('');
  const [formVisible, setFormVisible] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // File Upload Drag & Drop ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Supported File Formats list
  const FILE_TYPES = ['all', 'JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'];

  // Categories list combining predefined 7 categories with any dynamic ones
  const allCategories = useMemo(() => {
    const predefined = MEDIA_CATEGORIES_CONFIG.map((c) => c.name);
    const set = new Set<string>(predefined);
    mediaList.forEach((m) => {
      if (m.category && !set.has(m.category)) set.add(m.category);
    });
    return ['all', ...Array.from(set)];
  }, [mediaList]);

  // Subcategories available for current category selection in filter
  const currentCategorySubcategories = useMemo(() => {
    if (selectedCategory === 'all') {
      const set = new Set<string>();
      MEDIA_CATEGORIES_CONFIG.forEach((c) => c.subcategories.forEach((s) => set.add(s)));
      mediaList.forEach((m) => {
        if (m.subcategory) set.add(m.subcategory);
      });
      return ['all', ...Array.from(set)];
    }
    const config = MEDIA_CATEGORIES_CONFIG.find(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (config) {
      return ['all', ...config.subcategories];
    }
    const set = new Set<string>();
    mediaList
      .filter((m) => m.category?.toLowerCase() === selectedCategory.toLowerCase())
      .forEach((m) => {
        if (m.subcategory) set.add(m.subcategory);
      });
    return ['all', ...Array.from(set)];
  }, [selectedCategory, mediaList]);

  // Subcategories for Form Dropdown based on formCategory
  const formCategorySubcategories = useMemo(() => {
    const config = MEDIA_CATEGORIES_CONFIG.find(
      (c) => c.name.toLowerCase() === formCategory.toLowerCase()
    );
    return config ? config.subcategories : [];
  }, [formCategory]);

  // Filtered Media List
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.fileName?.toLowerCase().includes(q) ||
        item.alt?.toLowerCase().includes(q) ||
        item.slot?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.subcategory?.toLowerCase().includes(q) ||
        item.clientSection?.toLowerCase().includes(q) ||
        item.adminSection?.toLowerCase().includes(q) ||
        item.filePath?.toLowerCase().includes(q) ||
        item.page?.toLowerCase().includes(q) ||
        item.section?.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSubcat =
        selectedSubcategory === 'all' ||
        item.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase();

      const ext = item.fileType?.toUpperCase() || (item.fileName ? item.fileName.split('.').pop()?.toUpperCase() : '');
      const matchesFileType =
        selectedFileType === 'all' ||
        ext === selectedFileType ||
        (selectedFileType === 'JPG' && (ext === 'JPG' || ext === 'JPEG'));

      const usageInfo = checkMediaUsage(item);
      const isActive = usageInfo.isUsed || item.activeOnSite === true;

      const matchesUsage =
        selectedUsageFilter === 'all' ||
        (selectedUsageFilter === 'active' && isActive) ||
        (selectedUsageFilter === 'standalone' && !isActive) ||
        (selectedUsageFilter === 'hidden' && item.visible === false);

      return matchesSearch && matchesCat && matchesSubcat && matchesFileType && matchesUsage;
    });
  }, [mediaList, searchTerm, selectedCategory, selectedSubcategory, selectedFileType, selectedUsageFilter, checkMediaUsage]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to process uploaded file
  const processLocalFile = (file: File, isReplace = false) => {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG';
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeFormatted = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFormUrl(dataUrl);

      if (!isReplace) {
        setFormFileName(file.name);
        setFormFileType(ext);
        setFormFileSize(sizeFormatted);
        setFormFilePath(`/assets/uploads/${file.name}`);
        if (!formTitle) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setFormTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
        }
      }

      // Load Image to compute actual dimensions
      const img = new Image();
      img.onload = () => {
        const dims = `${img.naturalWidth} × ${img.naturalHeight} px`;
        setFormDimensions(dims);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Open Modals
  const handleOpenAdd = () => {
    setFormTitle('');
    setFormFileName('');
    setFormFileType('JPG');
    setFormFileSize('1.5 MB');
    setFormDimensions('2400 × 1600 px');
    setFormFilePath('/assets/uploads/');
    setFormUrl('');
    setFormAlt('');
    setFormDescription('');
    setFormCategory('Hero & Branding');
    setFormSubcategory('Hero banner');
    setFormClientSection('Home Page · Main Hero');
    setFormAdminSection('Content CMS');
    setFormPage('home');
    setFormSection('hero');
    setFormSlot('');
    setFormVisible(true);
    setFormOrder(mediaList.length + 1);
    setShowAddModal(true);
  };

  const handleOpenView = (item: MediaItem) => {
    setActiveItem(item);
    setZoomLevel(1);
    setShowViewModal(true);
  };

  const handleOpenEdit = (item: MediaItem) => {
    setActiveItem(item);
    setFormTitle(item.title || '');
    setFormFileName(item.fileName || '');
    setFormFileType(item.fileType || 'JPG');
    setFormFileSize(item.fileSize || '');
    setFormDimensions(item.dimensions || '');
    setFormFilePath(item.filePath || '');
    setFormUrl(item.url || '');
    setFormAlt(item.alt || '');
    setFormDescription(item.description || '');
    setFormCategory(item.category || 'Hero & Branding');
    setFormSubcategory(item.subcategory || '');
    setFormClientSection(item.clientSection || '');
    setFormAdminSection(item.adminSection || '');
    setFormPage(item.page || 'home');
    setFormSection(item.section || 'hero');
    setFormSlot(item.slot || '');
    setFormVisible(item.visible !== false);
    setFormOrder(item.order || 1);
    setShowEditModal(true);
  };

  const handleOpenReplace = (item: MediaItem) => {
    setActiveItem(item);
    setFormTitle(item.title);
    setFormUrl('');
    setFormFileName('');
    setFormSlot(item.slot || '');
    setShowReplaceModal(true);
  };

  // Actions
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim() || !formTitle.trim()) {
      setStatusMessage({ text: 'Please provide both an image URL and a title.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await addMedia({
        title: formTitle.trim(),
        fileName: formFileName.trim() || `${formTitle.toLowerCase().replace(/\s+/g, '-')}.${formFileType.toLowerCase()}`,
        fileType: formFileType,
        fileSize: formFileSize || '1.8 MB',
        dimensions: formDimensions || '2000 × 1400 px',
        filePath: formFilePath || `/assets/uploads/${formFileName || 'asset.jpg'}`,
        url: formUrl.trim(),
        alt: formAlt.trim() || formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        subcategory: formSubcategory,
        clientSection: formClientSection || (formSlot ? `Assigned to ${formSlot}` : 'Stand-alone'),
        adminSection: formAdminSection || 'Media Library',
        page: formPage,
        section: formSection,
        slot: formSlot.trim() || undefined,
        visible: formVisible,
        activeOnSite: Boolean(formSlot) || formVisible,
        order: Number(formOrder) || mediaList.length + 1,
        usageLabel: formSlot ? `Bound to slot: ${formSlot}` : formClientSection || undefined,
      });

      setShowAddModal(false);
      setStatusMessage({ text: `Image asset "${formTitle}" registered successfully.`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save image', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !formUrl.trim() || !formTitle.trim()) return;

    setSubmitting(true);
    try {
      await updateMedia(activeItem.id, {
        title: formTitle.trim(),
        fileName: formFileName.trim() || activeItem.fileName,
        fileType: formFileType || activeItem.fileType,
        fileSize: formFileSize || activeItem.fileSize,
        dimensions: formDimensions || activeItem.dimensions,
        filePath: formFilePath || activeItem.filePath,
        url: formUrl.trim(),
        alt: formAlt.trim() || formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        subcategory: formSubcategory,
        clientSection: formClientSection,
        adminSection: formAdminSection,
        page: formPage,
        section: formSection,
        slot: formSlot.trim() || undefined,
        visible: formVisible,
        activeOnSite: Boolean(formSlot) || formVisible,
        order: Number(formOrder) || activeItem.order,
      });

      setShowEditModal(false);
      setStatusMessage({ text: `Updated metadata for "${formTitle}".`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update image', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleExecuteReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !formUrl.trim()) return;

    setSubmitting(true);
    try {
      await replaceMedia(activeItem.id, formUrl.trim(), formTitle.trim() || activeItem.title, formSlot);
      setShowReplaceModal(false);
      setStatusMessage({
        text: `Replaced image for "${activeItem.title}". Website slots updated instantly!`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to replace image', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleExecuteDelete = async (force = false) => {
    if (!deleteConfirmItem) return;

    setSubmitting(true);
    try {
      const res = await deleteMedia(deleteConfirmItem.id, force);
      if (!res.success) {
        setStatusMessage({ text: res.error || 'Failed to delete image', type: 'error' });
      } else {
        setStatusMessage({
          text: `Deleted image "${deleteConfirmItem.title}" successfully.`,
          type: 'success',
        });
        setDeleteConfirmItem(null);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete image', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleReorder = async (item: MediaItem, direction: 'up' | 'down') => {
    const currentIdx = mediaList.findIndex((m) => m.id === item.id);
    if (currentIdx === -1) return;
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= mediaList.length) return;

    const currentOrder = item.order || currentIdx + 1;
    const neighbor = mediaList[targetIdx];
    const neighborOrder = neighbor.order || targetIdx + 1;

    await updateMedia(item.id, { order: neighborOrder });
    await updateMedia(neighbor.id, { order: currentOrder });
  };

  return (
    <div id="admin-media-library-view" className="space-y-6 font-sans">
      {/* Top Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D2C8] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-[3px] bg-[#6B4F3A] text-white text-[10px] uppercase font-mono tracking-wider font-semibold">
              Centralized Media Suite
            </span>
            <span className="text-xs text-[#66645F]">
              {mediaList.length} registered media assets
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold font-heading"
            style={{ color: design.headingColor }}
          >
            Centralized Media Library
          </h1>
          <p className="text-xs sm:text-sm text-[#66645F] mt-0.5">
            Single control hub managing all imagery across Hero &amp; Branding, Studio &amp; Team, Client Experience, Portfolio, Booking, Promotions, and System icons.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center border border-[#D8D2C8] rounded-[4px] bg-[#FFFFFF] p-0.5">
            <button
              type="button"
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                viewMode === 'grid'
                  ? 'bg-[#1C1C1A] text-[#F4F1EC]'
                  : 'text-[#66645F] hover:text-[#1C1C1A]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              type="button"
              id="btn-view-list"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                viewMode === 'list'
                  ? 'bg-[#1C1C1A] text-[#F4F1EC]'
                  : 'text-[#66645F] hover:text-[#1C1C1A]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {/* Upload New Image Button */}
          <button
            type="button"
            id="btn-upload-image-modal"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Image</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-[4px] border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Pills Navigation (7 Main Categories) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-[#D8D2C8]/70 scrollbar-thin">
          {allCategories.map((cat) => {
            const count =
              cat === 'all'
                ? mediaList.length
                : mediaList.filter((m) => m.category?.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                type="button"
                id={`tab-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSubcategory('all');
                }}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#1C1C1A] text-[#F4F1EC] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#66645F] hover:text-[#1C1C1A] border border-[#D8D2C8]'
                }`}
              >
                <span>{cat === 'all' ? 'All Categories' : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#6B4F3A] text-white'
                      : 'bg-[#E8E3DB] text-[#66645F]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Sub-Category Pills if Category is active */}
        {currentCategorySubcategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] uppercase font-mono text-[#66645F] mr-1 flex items-center gap-1 shrink-0">
              <Tag className="w-3 h-3 text-[#6B4F3A]" /> Sub-category:
            </span>
            {currentCategorySubcategories.map((subcat) => (
              <button
                key={subcat}
                type="button"
                onClick={() => setSelectedSubcategory(subcat)}
                className={`px-2.5 py-1 rounded-[3px] text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedSubcategory.toLowerCase() === subcat.toLowerCase()
                    ? 'bg-[#6B4F3A] text-white'
                    : 'bg-[#E8E3DB]/80 text-[#66645F] hover:text-[#1C1C1A]'
                }`}
              >
                {subcat === 'all' ? 'All Sub-categories' : subcat}
              </button>
            ))}
          </div>
        )}

        {/* Search, File Type, and Status Filter Controls Bar */}
        <div className="p-3 rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search by image name, title, alt text, or usage location */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#66645F]" />
            <input
              type="text"
              id="media-search-input"
              placeholder="Search by file name, usage, alt, slot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[4px] border border-[#D8D2C8] text-[#1C1C1A] bg-[#F4F1EC] focus:outline-none focus:border-[#6B4F3A]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            {/* Format Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#66645F] font-semibold uppercase tracking-wider">
                Format:
              </span>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="px-2 py-1 text-xs rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
              >
                <option value="all">ALL FORMATS</option>
                <option value="JPG">JPG / JPEG</option>
                <option value="PNG">PNG</option>
                <option value="WEBP">WEBP</option>
                <option value="SVG">SVG</option>
              </select>
            </div>

            {/* Usage Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#66645F] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#6B4F3A]" /> Status:
              </span>
              <select
                value={selectedUsageFilter}
                onChange={(e) => setSelectedUsageFilter(e.target.value as any)}
                className="px-2 py-1 text-xs rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
              >
                <option value="all">All Media</option>
                <option value="active">Active on Website</option>
                <option value="standalone">Standalone / Unassigned</option>
                <option value="hidden">Hidden from Website</option>
              </select>
            </div>

            <span className="text-[11px] text-[#66645F] font-mono pl-2 border-l border-[#D8D2C8]">
              {filteredMedia.length} / {mediaList.length}
            </span>
          </div>
        </div>
      </div>

      {/* Media Content Display (Loading / Empty / Grid / List) */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#66645F]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6B4F3A]" />
          <span>Synchronizing centralized media registry...</span>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-12 text-center rounded-[6px] border border-dashed border-[#D8D2C8] bg-[#FFFFFF] space-y-3">
          <ImageIcon className="w-10 h-10 text-[#66645F] mx-auto opacity-40" />
          <h3 className="text-sm font-semibold text-[#1C1C1A]">No media files match your criteria</h3>
          <p className="text-xs text-[#66645F]">
            Try clearing filters or upload a new photo asset into this category.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-[4px] bg-[#6B4F3A] text-white text-xs font-medium cursor-pointer"
          >
            Upload Media Asset
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* =========================================================================
           VIEW MODE 1: GRID CARDS
           ========================================================================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item, idx) => {
            const usageInfo = checkMediaUsage(item);
            const isActive = usageInfo.isUsed || item.activeOnSite === true;

            return (
              <div
                key={item.id}
                id={`media-card-${item.id}`}
                className={`rounded-[6px] border bg-[#FFFFFF] shadow-xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                  item.visible === false ? 'opacity-65 border-dashed border-zinc-400' : 'border-[#D8D2C8]'
                }`}
              >
                <div>
                  {/* Image Preview Canvas */}
                  <div className="relative aspect-[4/3] bg-[#E8E3DB] overflow-hidden group">
                    <img
                      src={item.url}
                      alt={item.alt || item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Top Badges: Format & Active Status */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap max-w-[85%]">
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-[#1C1C1A]/90 backdrop-blur-xs text-[9px] font-mono text-[#F4F1EC] uppercase font-bold tracking-wider">
                        {item.fileType || (item.fileName ? item.fileName.split('.').pop()?.toUpperCase() : 'JPG')}
                      </span>
                      {isActive ? (
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-emerald-800/90 text-white text-[9px] font-mono uppercase tracking-wider font-semibold">
                          Active on Site
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-zinc-800/75 text-zinc-200 text-[9px] font-mono uppercase tracking-wider">
                          Standalone
                        </span>
                      )}
                    </div>

                    {/* Top Right Quick Copy */}
                    <button
                      type="button"
                      title="Copy URL"
                      onClick={() => handleCopyUrl(item.url, item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-[3px] bg-[#1C1C1A]/80 text-[#F4F1EC] hover:bg-[#6B4F3A] transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Hover Fast Actions Bar */}
                    <div className="absolute inset-0 bg-[#1C1C1A]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      <button
                        type="button"
                        onClick={() => handleOpenView(item)}
                        className="p-2 rounded-full bg-[#F4F1EC] text-[#1C1C1A] hover:bg-[#6B4F3A] hover:text-white transition-colors cursor-pointer shadow"
                        title="View Full Size & Metadata Inspector"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReplace(item)}
                        className="p-2 rounded-full bg-[#F4F1EC] text-[#1C1C1A] hover:bg-[#6B4F3A] hover:text-white transition-colors cursor-pointer shadow"
                        title="Replace Image"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-full bg-[#F4F1EC] text-[#1C1C1A] hover:bg-[#6B4F3A] hover:text-white transition-colors cursor-pointer shadow"
                        title="Edit Metadata & Placements"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status Watermark if hidden */}
                    {item.visible === false && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-[3px] bg-rose-900/90 text-white text-[9px] uppercase font-mono tracking-wider font-semibold">
                        Hidden from Site
                      </div>
                    )}
                  </div>

                  {/* Card Body & Usage Information */}
                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs font-semibold text-[#1C1C1A] line-clamp-1" title={item.title}>
                          {item.title}
                        </h3>
                        {item.category && (
                          <span className="text-[9px] font-mono text-[#6B4F3A] uppercase shrink-0 font-semibold">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#66645F] font-mono mt-0.5">
                        <span className="truncate" title={item.fileName || 'asset.jpg'}>
                          {item.fileName || 'asset.jpg'}
                        </span>
                        {item.fileSize && <span className="shrink-0">{item.fileSize}</span>}
                      </div>
                    </div>

                    {/* Sub-category & Dimensions Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {item.subcategory && (
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-[#F4F1EC] border border-[#D8D2C8] text-[#6B4F3A] font-medium">
                          {item.subcategory}
                        </span>
                      )}
                      {item.dimensions && (
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-[#F4F1EC] border border-[#D8D2C8] text-[#66645F] font-mono">
                          {item.dimensions}
                        </span>
                      )}
                    </div>

                    {/* Placements & Where Used Box */}
                    <div className="p-2 rounded-[4px] bg-[#F4F1EC] border border-[#D8D2C8] space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#6B4F3A]">
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-[#6B4F3A]" /> Where Used:
                        </span>
                        {item.slot && (
                          <span className="font-mono text-[9px] text-[#1C1C1A]">
                            slot: {item.slot}
                          </span>
                        )}
                      </div>
                      {usageInfo.usages.length > 0 ? (
                        <div className="text-[11px] text-[#1C1C1A] font-medium leading-tight">
                          {usageInfo.usages[0]}
                          {usageInfo.usages.length > 1 && (
                            <span className="text-[10px] text-[#66645F] block font-normal mt-0.5">
                              + {usageInfo.usages.length - 1} other location(s)
                            </span>
                          )}
                        </div>
                      ) : item.clientSection ? (
                        <div className="text-[11px] text-[#1C1C1A] font-medium">
                          {item.clientSection}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#66645F] italic">
                          Stand-alone asset / Not bound to a live slot
                        </div>
                      )}
                    </div>

                    {/* Alt Text for SEO */}
                    {item.alt && (
                      <div className="text-[10px] text-[#66645F] italic line-clamp-1" title={item.alt}>
                        Alt: "{item.alt}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Control Actions */}
                <div className="p-2.5 bg-[#F4F1EC]/60 border-t border-[#D8D2C8] flex items-center justify-between gap-1 text-xs">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleReorder(item, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-[#66645F] hover:text-[#1C1C1A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(item, 'down')}
                      disabled={idx === filteredMedia.length - 1}
                      className="p-1 text-[#66645F] hover:text-[#1C1C1A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] font-mono text-[#66645F]">
                      #{item.order || idx + 1}
                    </span>
                  </div>

                  {/* Primary Actions: Replace, Toggle Visibility, Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenReplace(item)}
                      className="px-2 py-1 rounded-[3px] bg-[#FFFFFF] border border-[#D8D2C8] text-[11px] text-[#1C1C1A] hover:border-[#6B4F3A] hover:text-[#6B4F3A] font-medium transition-colors cursor-pointer flex items-center gap-1"
                      title="Replace Image"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleMediaVisibility(item.id)}
                      className={`p-1.5 rounded-[3px] border transition-colors cursor-pointer ${
                        item.visible !== false
                          ? 'border-[#D8D2C8] bg-white text-[#66645F] hover:text-[#1C1C1A]'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                      title={item.visible !== false ? 'Hide from Website' : 'Show on Website'}
                    >
                      {item.visible !== false ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem(item)}
                      className="p-1.5 rounded-[3px] border border-[#D8D2C8] bg-white text-[#66645F] hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
                      title="Delete Image Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =========================================================================
           VIEW MODE 2: HIGH-DENSITY LIST TABLE
           ========================================================================= */
        <div className="rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4F1EC] border-b border-[#D8D2C8] text-[11px] font-semibold uppercase tracking-wider text-[#6B4F3A]">
                <th className="p-3 w-16">Preview</th>
                <th className="p-3">File Name &amp; Title</th>
                <th className="p-3">Category / Sub-Category</th>
                <th className="p-3">Type &amp; Size</th>
                <th className="p-3">Dimensions</th>
                <th className="p-3">Placements &amp; Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C8]">
              {filteredMedia.map((item, idx) => {
                const usageInfo = checkMediaUsage(item);
                const isActive = usageInfo.isUsed || item.activeOnSite === true;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F4F1EC]/40 transition-colors"
                  >
                    {/* Thumbnail */}
                    <td className="p-3">
                      <div
                        onClick={() => handleOpenView(item)}
                        className="w-12 h-12 rounded-[3px] overflow-hidden border border-[#D8D2C8] bg-[#E8E3DB] cursor-pointer relative group"
                        title="Click to inspect full size"
                      >
                        <img
                          src={item.url}
                          alt={item.alt || item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    </td>

                    {/* File Name & Title */}
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-[#1C1C1A] text-xs">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-[#66645F] truncate mt-0.5" title={item.fileName}>
                        {item.fileName || 'asset.jpg'}
                      </div>
                      {item.alt && (
                        <div className="text-[10px] text-[#66645F] italic truncate mt-0.5" title={item.alt}>
                          Alt: "{item.alt}"
                        </div>
                      )}
                    </td>

                    {/* Category & Sub-Category */}
                    <td className="p-3">
                      <div className="font-medium text-[#1C1C1A]">
                        {item.category || 'General'}
                      </div>
                      {item.subcategory && (
                        <div className="text-[10px] text-[#6B4F3A] font-mono">
                          {item.subcategory}
                        </div>
                      )}
                    </td>

                    {/* Format & Size */}
                    <td className="p-3 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded-[2px] bg-[#F4F1EC] border border-[#D8D2C8] font-bold text-[#1C1C1A]">
                        {item.fileType || (item.fileName ? item.fileName.split('.').pop()?.toUpperCase() : 'JPG')}
                      </span>
                      <span className="text-[#66645F] block mt-1">
                        {item.fileSize || '1.8 MB'}
                      </span>
                    </td>

                    {/* Dimensions */}
                    <td className="p-3 font-mono text-[11px] text-[#66645F]">
                      {item.dimensions || '2400 × 1600 px'}
                    </td>

                    {/* Placements & Where Used */}
                    <td className="p-3 max-w-xs">
                      {usageInfo.usages.length > 0 ? (
                        <div className="text-[11px] text-[#1C1C1A] font-medium">
                          {usageInfo.usages[0]}
                          {item.slot && (
                            <span className="block text-[10px] font-mono text-[#6B4F3A]">
                              slot: {item.slot}
                            </span>
                          )}
                        </div>
                      ) : item.clientSection ? (
                        <div className="text-[11px] text-[#1C1C1A]">
                          {item.clientSection}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#66645F] italic">
                          Standalone
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[3px] bg-zinc-100 text-zinc-700 text-[10px] font-mono uppercase">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenView(item)}
                          className="p-1.5 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                          title="View Full Size & Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.url, item.id)}
                          className="p-1.5 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                          title="Copy Direct URL"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReplace(item)}
                          className="p-1.5 text-[#66645F] hover:text-[#6B4F3A] cursor-pointer"
                          title="Replace Image"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-[#66645F] hover:text-[#6B4F3A] cursor-pointer"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-[#66645F] hover:text-rose-700 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: VIEW FULL-SIZE IMAGE & METADATA INSPECTOR
          ========================================================================= */}
      {showViewModal && activeItem && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1A]/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#D8D2C8] flex items-center justify-between bg-[#F4F1EC]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#6B4F3A]" />
                <h3 className="text-sm font-semibold font-heading text-[#1C1C1A]">
                  Full-Resolution Inspector · {activeItem.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center border border-[#D8D2C8] rounded-[3px] bg-white">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1.5 text-[#66645F]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1 border-l border-[#D8D2C8] text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Image Preview Canvas + Metadata Details Panel */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Canvas Preview */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#E8E3DB] rounded-[4px] border border-[#D8D2C8] p-4 overflow-hidden min-h-[300px]">
                <div className="overflow-auto max-h-[500px] w-full flex items-center justify-center">
                  <img
                    src={activeItem.url}
                    alt={activeItem.alt || activeItem.title}
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    className="max-h-[460px] object-contain transition-transform duration-200"
                  />
                </div>
                <div className="flex items-center justify-between w-full pt-3 mt-3 border-t border-[#D8D2C8]/60 text-[11px] text-[#66645F]">
                  <span className="font-mono">{activeItem.dimensions || '2400 × 1600 px'}</span>
                  <a
                    href={activeItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#6B4F3A] hover:underline"
                  >
                    <span>Open Raw Original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Inspector Metadata Panel */}
              <div className="lg:col-span-5 space-y-4 text-xs font-sans">
                {/* File Specifications Box */}
                <div className="p-3.5 bg-[#F4F1EC] rounded-[4px] border border-[#D8D2C8] space-y-2">
                  <span className="text-[#6B4F3A] font-semibold block uppercase text-[10px] tracking-wider">
                    File Specifications:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#66645F] block text-[10px]">File Name:</span>
                      <span className="font-mono text-[#1C1C1A] font-semibold break-all">
                        {activeItem.fileName || 'asset.jpg'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#66645F] block text-[10px]">File Format:</span>
                      <span className="font-mono text-[#1C1C1A] font-semibold">
                        {activeItem.fileType || 'JPG'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#66645F] block text-[10px]">File Size:</span>
                      <span className="font-mono text-[#1C1C1A]">
                        {activeItem.fileSize || '1.8 MB'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#66645F] block text-[10px]">Dimensions:</span>
                      <span className="font-mono text-[#1C1C1A]">
                        {activeItem.dimensions || '2400 × 1600 px'}
                      </span>
                    </div>
                  </div>

                  {activeItem.filePath && (
                    <div className="pt-1.5 border-t border-[#D8D2C8] text-[10px] font-mono text-[#66645F] truncate">
                      Storage Path: {activeItem.filePath}
                    </div>
                  )}
                </div>

                {/* Categorization & Placements */}
                <div className="p-3.5 bg-[#F4F1EC] rounded-[4px] border border-[#D8D2C8] space-y-2">
                  <span className="text-[#6B4F3A] font-semibold block uppercase text-[10px] tracking-wider">
                    Categorization &amp; Placements:
                  </span>
                  <div className="text-[11px] space-y-1">
                    <p>
                      <strong className="text-[#66645F]">Category:</strong>{' '}
                      <span className="font-medium text-[#1C1C1A]">{activeItem.category || 'General'}</span>
                      {activeItem.subcategory && (
                        <span className="text-[#6B4F3A] ml-1">({activeItem.subcategory})</span>
                      )}
                    </p>
                    <p>
                      <strong className="text-[#66645F]">Client Page Section:</strong>{' '}
                      <span>{activeItem.clientSection || activeItem.page || 'Universal'}</span>
                    </p>
                    <p>
                      <strong className="text-[#66645F]">Admin Page Section:</strong>{' '}
                      <span>{activeItem.adminSection || 'Content CMS'}</span>
                    </p>
                    <p>
                      <strong className="text-[#66645F]">Direct Website Slot:</strong>{' '}
                      <span className="font-mono text-[#6B4F3A] font-semibold">
                        {activeItem.slot || 'None (Stand-alone asset)'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* SEO & Alt Text */}
                <div className="p-3.5 bg-[#F4F1EC] rounded-[4px] border border-[#D8D2C8] space-y-1.5">
                  <span className="text-[#6B4F3A] font-semibold block uppercase text-[10px] tracking-wider">
                    SEO &amp; Accessibility Alt Text:
                  </span>
                  <p className="text-[#1C1C1A] font-medium leading-relaxed">
                    "{activeItem.alt || activeItem.title}"
                  </p>
                </div>

                {/* Live Usages Badge */}
                <div className="p-3 bg-amber-50 rounded-[4px] border border-amber-200 text-xs">
                  <span className="font-semibold text-amber-900 block text-[10px] uppercase tracking-wider">
                    Active Website Usages ({checkMediaUsage(activeItem).usages.length}):
                  </span>
                  {checkMediaUsage(activeItem).usages.length > 0 ? (
                    <ul className="mt-1 list-disc list-inside text-amber-800 space-y-0.5 text-[11px]">
                      {checkMediaUsage(activeItem).usages.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[11px] text-amber-700 italic">
                      This asset is not bound to a fixed client slot.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleCopyUrl(activeItem.url, activeItem.id)}
                className="px-3 py-1.5 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] hover:border-[#6B4F3A] flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === activeItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied URL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenReplace(activeItem);
                  }}
                  className="px-3.5 py-1.5 rounded-[4px] bg-[#6B4F3A] text-white hover:bg-[#1C1C1A] cursor-pointer font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: UPLOAD / REGISTER NEW IMAGE ASSET
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1A]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in my-8">
            <div className="p-4 border-b border-[#D8D2C8] flex items-center justify-between bg-[#F4F1EC]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#6B4F3A]" />
                <h3 className="text-sm font-semibold font-heading text-[#1C1C1A]">
                  Upload &amp; Register New Media Asset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-5 space-y-4 text-xs">
              {/* Drag & Drop or Local File Selection Zone */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Upload Image File (Drag &amp; Drop or Browse)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processLocalFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[6px] p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-[#6B4F3A] bg-[#6B4F3A]/5'
                      : 'border-[#D8D2C8] bg-[#F4F1EC]/60 hover:bg-[#F4F1EC]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processLocalFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 mx-auto mb-1.5 text-[#6B4F3A]" />
                  <p className="font-semibold text-[#1C1C1A]">
                    Click to browse files or drag and drop image here
                  </p>
                  <p className="text-[10px] text-[#66645F] mt-0.5">
                    Supports JPG, JPEG, PNG, WEBP, and SVG (auto-extracts resolution &amp; size)
                  </p>
                </div>
              </div>

              {/* Direct Image URL fallback */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Or Direct Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or cloud storage URL"
                  value={formUrl}
                  onChange={(e) => {
                    setFormUrl(e.target.value);
                    if (!formFileName && e.target.value) {
                      const urlParts = e.target.value.split('/');
                      const lastPart = urlParts[urlParts.length - 1].split('?')[0];
                      if (lastPart) setFormFileName(lastPart);
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
                {/* Live Preview */}
                {formUrl && (
                  <div className="mt-2 relative aspect-[16/9] max-h-36 rounded border border-[#D8D2C8] overflow-hidden bg-[#E8E3DB] flex items-center justify-center">
                    <img src={formUrl} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-2 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
                      Live Preview
                    </span>
                  </div>
                )}
              </div>

              {/* File Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Image Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Mandap Nuptials"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    File Name (e.g. hero-main.jpg)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. wedding-hero-01.jpg"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>
              </div>

              {/* Format, Size, Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Format
                  </label>
                  <select
                    value={formFileType}
                    onChange={(e) => setFormFileType(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  >
                    <option value="JPG">JPG</option>
                    <option value="JPEG">JPEG</option>
                    <option value="PNG">PNG</option>
                    <option value="WEBP">WEBP</option>
                    <option value="SVG">SVG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    File Size
                  </label>
                  <input
                    type="text"
                    placeholder="1.8 MB"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    placeholder="2400 × 1600 px"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Category (1 of 7 Central Categories) *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      const catConfig = MEDIA_CATEGORIES_CONFIG.find((c) => c.name === e.target.value);
                      if (catConfig && catConfig.subcategories.length > 0) {
                        setFormSubcategory(catConfig.subcategories[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  >
                    {MEDIA_CATEGORIES_CONFIG.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Sub-Category
                  </label>
                  {formCategorySubcategories.length > 0 ? (
                    <select
                      value={formSubcategory}
                      onChange={(e) => setFormSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                    >
                      {formCategorySubcategories.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Hero banner, Portraits"
                      value={formSubcategory}
                      onChange={(e) => setFormSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                    />
                  )}
                </div>
              </div>

              {/* Client Page Section & Admin Page Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Client Page Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Home Page · Main Hero"
                    value={formClientSection}
                    onChange={(e) => setFormClientSection(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Admin Page Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Content CMS · Hero"
                    value={formAdminSection}
                    onChange={(e) => setFormAdminSection(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>
              </div>

              {/* Alt text for SEO */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Alt Text for SEO &amp; Screen Readers
                </label>
                <input
                  type="text"
                  placeholder="Descriptive visual text enhancing search rankings..."
                  value={formAlt}
                  onChange={(e) => setFormAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              {/* Slot Binding */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Assign To Live Website Slot (Optional)
                </label>
                <select
                  value={formSlot}
                  onChange={(e) => setFormSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                >
                  <option value="">-- Standalone (Do not bind to a fixed slot) --</option>
                  {WEBSITE_IMAGE_SLOTS.map((s) => (
                    <option key={s.slot} value={s.slot}>
                      {s.name} ({s.slot})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formVisible}
                    onChange={(e) => setFormVisible(e.target.checked)}
                    className="w-4 h-4 accent-[#6B4F3A]"
                  />
                  <span className="text-[11px] font-medium text-[#1C1C1A]">
                    Active and visible across the website
                  </span>
                </label>
              </div>

              <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] -mx-5 -mb-5 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-[4px] bg-[#1C1C1A] text-white hover:bg-[#6B4F3A] font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  {submitting ? 'Registering...' : 'Save & Publish Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REPLACE EXISTING IMAGE
          ========================================================================= */}
      {showReplaceModal && activeItem && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-4 border-b border-[#D8D2C8] flex items-center justify-between bg-[#F4F1EC]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#6B4F3A]" />
                <h3 className="text-sm font-semibold font-heading text-[#1C1C1A]">
                  Replace Image: {activeItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteReplace} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#66645F] block mb-1">
                    Current Visual
                  </span>
                  <div className="relative aspect-[4/3] rounded border border-[#D8D2C8] overflow-hidden bg-[#E8E3DB]">
                    <img src={activeItem.url} alt="Current" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#6B4F3A] block mb-1">
                    New Replacement Preview
                  </span>
                  <div className="relative aspect-[4/3] rounded border border-dashed border-[#6B4F3A] overflow-hidden bg-[#F4F1EC] flex items-center justify-center text-center p-2">
                    {formUrl ? (
                      <img src={formUrl} alt="New Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-[#66645F] italic">Upload or paste URL below</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Warning */}
              {activeItem.slot && (
                <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#6B4F3A] shrink-0 mt-0.5" />
                  <div>
                    <strong>Direct Slot Binding:</strong> Replacing this image will immediately update{' '}
                    <strong>{activeItem.slot}</strong> everywhere it appears on the live public website!
                  </div>
                </div>
              )}

              {/* File upload or URL */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Upload Replacement File
                </label>
                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processLocalFile(e.target.files[0], true);
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Or Paste New Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or your CDN URL"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] -mx-5 -mb-5 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-3.5 py-2 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formUrl.trim()}
                  className="px-4 py-2 rounded-[4px] bg-[#6B4F3A] text-white hover:bg-[#1C1C1A] font-semibold uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? 'Applying...' : 'Confirm & Replace Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT METADATA & PLACEMENTS
          ========================================================================= */}
      {showEditModal && activeItem && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1A]/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in my-8">
            <div className="p-4 border-b border-[#D8D2C8] flex items-center justify-between bg-[#F4F1EC]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#6B4F3A]" />
                <h3 className="text-sm font-semibold font-heading text-[#1C1C1A]">
                  Edit Image Metadata &amp; Placements
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Image Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      const catConfig = MEDIA_CATEGORIES_CONFIG.find((c) => c.name === e.target.value);
                      if (catConfig && catConfig.subcategories.length > 0) {
                        setFormSubcategory(catConfig.subcategories[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  >
                    {MEDIA_CATEGORIES_CONFIG.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Sub-Category
                  </label>
                  <input
                    type="text"
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Client Page Section
                  </label>
                  <input
                    type="text"
                    value={formClientSection}
                    onChange={(e) => setFormClientSection(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                    Admin Page Section
                  </label>
                  <input
                    type="text"
                    value={formAdminSection}
                    onChange={(e) => setFormAdminSection(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Alt Text for SEO
                </label>
                <input
                  type="text"
                  value={formAlt}
                  onChange={(e) => setFormAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#1C1C1A] mb-1">
                  Website Slot Binding
                </label>
                <select
                  value={formSlot}
                  onChange={(e) => setFormSlot(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D2C8] rounded-[4px] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                >
                  <option value="">-- None (Standalone) --</option>
                  {WEBSITE_IMAGE_SLOTS.map((s) => (
                    <option key={s.slot} value={s.slot}>
                      {s.name} ({s.slot})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-visible-checkbox"
                  checked={formVisible}
                  onChange={(e) => setFormVisible(e.target.checked)}
                  className="w-4 h-4 accent-[#6B4F3A]"
                />
                <label htmlFor="edit-visible-checkbox" className="text-[11px] font-medium text-[#1C1C1A]">
                  Active and visible on public website
                </label>
              </div>

              <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] -mx-5 -mb-5 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-[4px] bg-[#1C1C1A] text-white hover:bg-[#6B4F3A] font-semibold uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: SAFE DELETE CONFIRMATION WITH USAGE GUARD
          ========================================================================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-[#1C1C1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D8D2C8] rounded-[6px] max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-4 border-b border-[#D8D2C8] flex items-center gap-2 bg-rose-50 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="text-sm font-semibold font-heading">
                Confirm Media Asset Deletion
              </h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-[#1C1C1A]">
                Are you sure you want to delete the image asset:
                <strong className="block text-sm font-medium mt-1">"{deleteConfirmItem.title}"</strong>
                <span className="block font-mono text-[10px] text-[#66645F] mt-0.5">
                  {deleteConfirmItem.fileName || 'asset.jpg'}
                </span>
              </p>

              {/* Safety Alert if In Use */}
              {checkMediaUsage(deleteConfirmItem).usages.length > 0 || deleteConfirmItem.slot ? (
                <div className="p-3 bg-amber-50 rounded border border-amber-300 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1 font-semibold uppercase text-[10px] text-amber-950">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>⚠️ Safety Warning: Image Is In Active Use</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This media item is currently referenced on the live client website in:
                  </p>
                  <ul className="list-disc list-inside font-medium text-[11px] space-y-0.5">
                    {checkMediaUsage(deleteConfirmItem).usages.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                    {deleteConfirmItem.slot && !checkMediaUsage(deleteConfirmItem).usages.some(u => u.includes(deleteConfirmItem.slot!)) && (
                      <li>Assigned slot: {deleteConfirmItem.slot}</li>
                    )}
                  </ul>
                  <p className="text-[10px] text-amber-800 pt-1 border-t border-amber-200">
                    Deleting it will unbind this slot and revert the website to studio fallback visuals. We recommend using <strong>"Replace Image"</strong> instead.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-[#F4F1EC] rounded border border-[#D8D2C8] text-[#66645F] text-[11px]">
                  This media file is not bound to any active public slot and can be safely deleted.
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F4F1EC] border-t border-[#D8D2C8] flex items-center justify-between gap-2 text-xs">
              {checkMediaUsage(deleteConfirmItem).usages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const itemToReplace = deleteConfirmItem;
                    setDeleteConfirmItem(null);
                    handleOpenReplace(itemToReplace);
                  }}
                  className="px-3 py-1.5 rounded-[4px] border border-[#6B4F3A] text-[#6B4F3A] hover:bg-[#6B4F3A] hover:text-white transition-colors cursor-pointer font-medium"
                >
                  Replace Instead
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#D8D2C8] bg-white text-[#1C1C1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteDelete(true)}
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-[4px] bg-rose-700 hover:bg-rose-800 text-white font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  {submitting ? 'Deleting...' : 'Force Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
