import React, { useEffect, useState } from 'react';
import {
  Star,
  Plus,
  CheckCircle2,
  Trash2,
  Check,
  X,
  MessageSquare,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../../context/StudioContext';
import { useToast } from '../../context/ToastContext';
import { INITIAL_REVIEWS } from '../../data/defaults';
import { ReviewItem } from '../../types';

export const AdminTestimonials: React.FC = () => {
  const { design } = useStudio();
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New review form
  const [name, setName] = useState('');
  const [service, setService] = useState('Bridal & Wedding Photography');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReviewItem, 'id'>),
          }));
          setReviews(list);
        } else {
          setReviews(INITIAL_REVIEWS.map((r, i) => ({ ...r, id: r.id || `rev_def_${i + 1}` })));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Reviews snapshot error, falling back to defaults:', err.message);
        setReviews(INITIAL_REVIEWS.map((r, i) => ({ ...r, id: r.id || `rev_def_${i + 1}` })));
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleApprove = async (item: ReviewItem) => {
    if (!item.id) return;
    try {
      await setDoc(doc(db, 'reviews', item.id), { approved: true }, { merge: true });
      setReviews((prev) => prev.map((r) => (r.id === item.id ? { ...r, approved: true } : r)));
      showSuccess('Testimonial approved and published to website.');
    } catch (err: any) {
      showError('Error approving testimonial: ' + err.message);
    }
  };

  const handleDelete = async (item: ReviewItem) => {
    if (!item.id) return;
    if (!window.confirm(`Delete review from "${item.customerName || item.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'reviews', item.id));
      setReviews((prev) => prev.filter((r) => r.id !== item.id));
      showSuccess('Testimonial deleted.');
    } catch (err: any) {
      showError('Error deleting testimonial: ' + err.message);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reviewText.trim()) return;

    setSubmitting(true);
    try {
      const id = `rev_${Date.now()}`;
      const payload: ReviewItem = {
        id,
        customerName: name.trim(),
        name: name.trim(),
        service: service.trim(),
        rating,
        reviewText: reviewText.trim(),
        approved: true,
        order: reviews.length + 1,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'reviews', id), payload, { merge: true });
      setShowAddModal(false);
      setName('');
      setReviewText('');
      showSuccess('Review added and published successfully.');
    } catch (err: any) {
      showError('Error adding review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div id="admin-testimonials-view" className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading" style={{ color: design.headingColor }}>
            Patron Testimonials &amp; Praise
          </h1>
          <p className="text-xs sm:text-sm text-[#66645F] mt-1">
            Review client submissions, approve public displays on the reviews page, or curate editorial accolades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Editorial Testimonial</span>
          </button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="p-4 rounded-[6px] border border-amber-300 bg-amber-50 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>{pendingCount} new testimonial(s) awaiting administrative approval.</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#66645F]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6B4F3A]" />
          <span>Loading client testimonials...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((item, itemIdx) => (
            <div
              key={item.id || item.customerName || `rev-${itemIdx}`}
              className="rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1C1A]">{item.customerName || item.name}</h3>
                    <span className="text-[11px] text-[#6B4F3A] font-mono block">{item.service}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      item.approved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.approved ? 'Live' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-[#66645F] italic leading-relaxed">
                  "{item.reviewText}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8D2C8] flex items-center justify-between">
                <div>
                  {!item.approved && (
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-sans">
          <div className="w-full max-w-md rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8D2C8] pb-3">
              <h2 className="text-base font-semibold text-[#1C1C1A]">Add Editorial Testimonial</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Patron / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ananya &amp; Siddharth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Service / Commission
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Star Rating (1 - 5)
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                  Review Text *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Words of appreciation..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[4px] border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8D2C8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-[4px] border border-[#D8D2C8] text-[#66645F] hover:text-[#1C1C1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 uppercase tracking-wider font-semibold rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] cursor-pointer transition-colors"
                >
                  {submitting ? 'Publishing...' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
