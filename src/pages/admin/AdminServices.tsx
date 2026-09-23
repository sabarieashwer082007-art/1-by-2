import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Clock,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useToast } from '../../context/ToastContext';
import { INITIAL_SERVICES } from '../../data/defaults';
import { ServiceItem } from '../../types';

export const AdminServices: React.FC = () => {
  const { design } = useStudio();
  const { showSuccess, showError } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceItem, 'id'>),
          }));
          setServices(list);
        } else {
          setServices(
            INITIAL_SERVICES.map((s, idx) => ({
              ...s,
              id: s.id || `srv_default_${idx + 1}`,
            }))
          );
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Services snapshot error, using default seeds:', err.message);
        setServices(
          INITIAL_SERVICES.map((s, idx) => ({
            ...s,
            id: s.id || `srv_default_${idx + 1}`,
          }))
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setTagline('');
    setDescription('');
    setStartingPrice('₹45,000');
    setDuration('4 - 8 Hours');
    setFeaturesStr('High-resolution retouched master files\nPrivate encrypted online atelier gallery\nLead principal master photographer\nPre-commission consultation');
    setShowModal(true);
  };

  const handleOpenEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setTitle(item.title || item.name || '');
    setTagline(item.tagline || '');
    setDescription(item.description);
    setStartingPrice(item.startingPrice || '');
    setDuration(item.duration || '');
    setFeaturesStr(item.features ? item.features.join('\n') : '');
    setShowModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const features = featuresStr
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const id = editingItem?.id || `srv_${Date.now()}`;
      const payload: ServiceItem = {
        id,
        name: title.trim(),
        title: title.trim(),
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        tagline: tagline.trim(),
        description: description.trim(),
        startingPrice: startingPrice.trim(),
        duration: duration.trim(),
        features,
        active: editingItem ? editingItem.active : true,
        order: editingItem?.order || services.length + 1,
      };

      await setDoc(doc(db, 'services', id), payload, { merge: true });
      setShowModal(false);
      showSuccess(editingItem ? 'Discipline updated successfully.' : 'New discipline added.');
    } catch (err: any) {
      showError('Error saving discipline: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: ServiceItem) => {
    if (!item.id) return;
    const updated = !item.active;
    try {
      await setDoc(doc(db, 'services', item.id), { active: updated }, { merge: true });
      setServices((prev) => prev.map((s) => (s.id === item.id ? { ...s, active: updated } : s)));
      showSuccess(updated ? 'Discipline activated.' : 'Discipline deactivated.');
    } catch (err: any) {
      console.error('Toggle active error:', err);
      showError('Failed to update status.');
    }
  };

  const handleDeleteService = async (item: ServiceItem) => {
    if (!item.id) return;
    if (!window.confirm(`Delete discipline "${item.title || item.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'services', item.id));
      setServices((prev) => prev.filter((s) => s.id !== item.id));
      showSuccess('Discipline deleted.');
    } catch (err: any) {
      showError('Error deleting service: ' + err.message);
    }
  };

  return (
    <div id="admin-services-view" className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Disciplines &amp; Studio Services
          </h1>
          <p className="text-xs sm:text-sm text-[#66645F] mt-1">
            Manage packages, pricing, deliverables, and booking commission disciplines shown on the public site.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Discipline</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#66645F]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6B4F3A]" />
          <span>Loading studio services...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((item, itemIdx) => {
            const serviceKey = `service-${item.id || 'seed'}-${item.slug || 'item'}-${itemIdx}`;
            return (
              <div
                key={serviceKey}
                className="rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] p-6 shadow-sm flex flex-col justify-between space-y-6 group hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#6B4F3A] font-semibold block">
                        {item.tagline || 'Studio Discipline'}
                      </span>
                      <h3 className="text-lg font-bold font-heading text-[#1C1C1A] mt-0.5">
                        {item.title || item.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-semibold uppercase ${
                        item.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-xs text-[#66645F] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-[#D8D2C8] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#66645F] uppercase tracking-wider block">Investment</span>
                      <span className="font-semibold text-[#1C1C1A]">{item.startingPrice || 'On Request'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#66645F] uppercase tracking-wider block">Duration</span>
                      <span className="font-semibold text-[#1C1C1A]">{item.duration || 'Custom'}</span>
                    </div>
                  </div>

                  {item.features && item.features.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#66645F] uppercase tracking-wider font-semibold block">Includes:</span>
                      <ul className="text-[11px] text-[#66645F] space-y-1">
                        {item.features.slice(0, 3).map((f: string, idx: number) => (
                          <li key={`${serviceKey}-feat-${idx}`} className="flex items-center gap-1.5 truncate">
                            <span className="w-1 h-1 rounded-full bg-[#6B4F3A]" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              <div className="pt-4 border-t border-[#D8D2C8] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  className="text-xs text-[#66645F] hover:text-[#1C1C1A] flex items-center gap-1 cursor-pointer"
                >
                  {item.active ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-xs rounded border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] hover:bg-[#E8E3DB] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(item)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Discipline */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-sans">
          <div className="w-full max-w-lg rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8D2C8] pb-3">
              <h2 className="text-base font-semibold text-[#1C1C1A]">
                {editingItem ? `Edit Discipline: ${editingItem.title || editingItem.name}` : 'Add New Discipline'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fine-Art Bridal Commission"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Tagline / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heritage Weddings & Celebrations"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                    Starting Investment
                  </label>
                  <input
                    type="text"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                    Standard Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Features &amp; Deliverables (One per line)
                </label>
                <textarea
                  rows={3}
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8D2C8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-[4px] border border-[#D8D2C8] text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 uppercase tracking-wider font-semibold rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] cursor-pointer transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Discipline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
