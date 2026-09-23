import React, { useEffect, useState } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Star,
  ArrowUp,
  ArrowDown,
  Upload,
  FolderPlus,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_CATEGORIES, INITIAL_PORTFOLIO } from '../../data/defaults';
import { PortfolioItem, PortfolioCategory } from '../../types';

export const AdminPortfolio: React.FC = () => {
  const { design } = useStudio();
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Item form state
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('Wedding');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemFeatured, setItemFeatured] = useState(false);
  const [itemVisible, setItemVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Category form state
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    // 1. Listen categories
    const unsubCats = onSnapshot(
      query(collection(db, 'portfolioCategories'), orderBy('order', 'asc')),
      (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCategory)));
        } else {
          // Initialize defaults if empty
          setCategories(DEFAULT_CATEGORIES.filter(c => c.slug !== 'all'));
        }
      },
      (err) => {
        console.error('Portfolio categories listener error:', err);
      }
    );

    // 2. Listen portfolio items
    const unsubItems = onSnapshot(
      query(collection(db, 'portfolio'), orderBy('order', 'asc')),
      (snap) => {
        if (!snap.empty) {
          setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem)));
        } else {
          // Seed defaults into local view
          setItems(INITIAL_PORTFOLIO.map((p, i) => ({ ...p, id: `init_${i}` })));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Portfolio items listener error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubCats();
      unsubItems();
    };
  }, []);

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemCategory(categories[0]?.name || 'Wedding');
    setItemImageUrl('');
    setItemDescription('');
    setItemFeatured(false);
    setItemVisible(true);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemCategory(item.category);
    setItemImageUrl(item.imageUrl);
    setItemDescription(item.description || '');
    setItemFeatured(item.featured);
    setItemVisible(item.visible);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemImageUrl.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: itemTitle.trim(),
        category: itemCategory,
        imageUrl: itemImageUrl.trim(),
        description: itemDescription.trim(),
        featured: itemFeatured,
        visible: itemVisible,
        updatedAt: new Date().toISOString(),
      };

      if (editingItem?.id && !editingItem.id.startsWith('init_')) {
        await updateDoc(doc(db, 'portfolio', editingItem.id), payload);
      } else {
        await addDoc(collection(db, 'portfolio'), {
          ...payload,
          order: items.length + 1,
          createdAt: new Date().toISOString(),
        });
      }

      setShowItemModal(false);
      showSuccess(editingItem ? 'Portfolio work updated!' : 'New portfolio work added!');
    } catch (err: any) {
      showError('Error saving portfolio work: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: PortfolioItem) => {
    if (!window.confirm(`Delete "${item.title}" from portfolio?`)) return;

    try {
      if (item.id && !item.id.startsWith('init_') && !item.id.startsWith('default_')) {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/admin/portfolio/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // If server returns error, fallback to client deleteDoc if permitted
          try {
            await deleteDoc(doc(db, 'portfolio', item.id));
          } catch (clientErr) {
            throw new Error(errData.message || errData.error || 'Failed to delete portfolio item.');
          }
        }
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showSuccess(`"${item.title}" deleted.`);
    } catch (err: any) {
      console.error('Delete error:', err);
      showError('Failed to delete: ' + err.message);
    }
  };

  const handleToggleVisible = async (item: PortfolioItem) => {
    if (item.id && !item.id.startsWith('init_')) {
      await updateDoc(doc(db, 'portfolio', item.id), {
        visible: !item.visible,
      });
    } else {
      setItems(items.map(i => i.id === item.id ? { ...i, visible: !i.visible } : i));
    }
  };

  const handleToggleFeatured = async (item: PortfolioItem) => {
    if (item.id && !item.id.startsWith('init_')) {
      await updateDoc(doc(db, 'portfolio', item.id), {
        featured: !item.featured,
      });
    } else {
      setItems(items.map(i => i.id === item.id ? { ...i, featured: !i.featured } : i));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const slug = newCatName.toLowerCase().replace(/\s+/g, '-');
      await addDoc(collection(db, 'portfolioCategories'), {
        name: newCatName.trim(),
        slug,
        order: categories.length + 1,
      });
      setNewCatName('');
      setShowCategoryModal(false);
      showSuccess('Category added successfully.');
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <div id="admin-portfolio-mgmt" className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Portfolio &amp; Media Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Curate photographs, categories, and homepage featured selections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border flex items-center gap-2 hover:bg-white/5"
            style={{ borderColor: design.borderColor, color: design.headingColor }}
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>Manage Categories</span>
          </button>

          <button
            id="admin-add-portfolio-btn"
            onClick={openAddItemModal}
            className="px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow transition-transform hover:scale-105"
            style={{
              backgroundColor: design.buttonColor,
              color: '#0a0d14',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Portfolio Photo</span>
          </button>
        </div>
      </div>

      {/* Grid of Portfolio Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="rounded-xl border overflow-hidden flex flex-col justify-between group"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            {/* Image Preview Container */}
            <div className="relative h-60 overflow-hidden bg-black/40">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border backdrop-blur-md"
                  style={{
                    backgroundColor: `${design.accentColor}26`,
                    borderColor: `${design.accentColor}4d`,
                    color: design.accentColor,
                  }}
                >
                  {item.category}
                </span>
                {item.featured && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-black flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1">
                <button
                  onClick={() => handleToggleVisible(item)}
                  className={`p-1.5 rounded-full backdrop-blur-md ${
                    item.visible ? 'bg-black/60 text-white' : 'bg-red-950/80 text-red-300'
                  }`}
                  title={item.visible ? 'Visible on Public Portfolio' : 'Hidden from Public'}
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Description & Action controls */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-base font-heading" style={{ color: design.headingColor }}>
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: design.borderColor }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase ${
                      item.featured ? 'border-amber-400 text-amber-400' : 'text-neutral-400'
                    }`}
                    style={{ borderColor: item.featured ? undefined : design.borderColor }}
                  >
                    {item.featured ? 'Featured' : 'Feature'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditItemModal(item)}
                    className="p-1.5 rounded border hover:bg-white/10 text-neutral-300"
                    style={{ borderColor: design.borderColor }}
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="p-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-950/40"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Portfolio Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="max-w-lg w-full p-6 sm:p-8 rounded-2xl border space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: design.borderColor }}>
              <h2 className="text-xl font-bold font-heading" style={{ color: design.headingColor }}>
                {editingItem ? 'Edit Portfolio Photograph' : 'Add New Portfolio Photograph'}
              </h2>
              <button onClick={() => setShowItemModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Artwork Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Twilight Nuptials"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Category *
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                  style={{ borderColor: design.borderColor }}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Photo Image URL / Firebase Storage URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or storage URL"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                />
                {itemImageUrl && (
                  <div className="mt-2 h-32 rounded overflow-hidden border" style={{ borderColor: design.borderColor }}>
                    <img src={itemImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                  Description / Story Behind Frame
                </label>
                <textarea
                  rows={3}
                  placeholder="Atmosphere details, lighting techniques, camera lens, or mood..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none focus:border-amber-400"
                  style={{ borderColor: design.borderColor }}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={itemFeatured}
                    onChange={(e) => setItemFeatured(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-neutral-300">Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={itemVisible}
                    onChange={(e) => setItemVisible(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-neutral-300">Visible on Public Site</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: design.borderColor }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs uppercase text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded text-xs uppercase font-bold"
                  style={{
                    backgroundColor: design.buttonColor,
                    color: '#0a0d14',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save & Publish Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="max-w-md w-full p-6 rounded-2xl border space-y-6 animate-in zoom-in-95"
            style={{
              backgroundColor: design.surfaceColor,
              borderColor: design.borderColor,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: design.borderColor }}>
              <h2 className="text-lg font-bold font-heading" style={{ color: design.headingColor }}>
                Portfolio Categories
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c.slug}
                  className="flex items-center justify-between p-2.5 rounded border text-xs"
                  style={{ borderColor: design.borderColor }}
                >
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-neutral-500 font-mono text-[10px]">{c.slug}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3 pt-2 border-t" style={{ borderColor: design.borderColor }}>
              <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400">
                Create New Category
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Architecture"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded bg-black/40 border text-white focus:outline-none"
                  style={{ borderColor: design.borderColor }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: design.buttonColor,
                    color: '#0a0d14',
                  }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
