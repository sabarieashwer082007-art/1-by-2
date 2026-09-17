import React, { useEffect, useState } from 'react';
import { Star, Plus, CheckCircle2, X } from 'lucide-react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStudio } from '../context/StudioContext';
import { INITIAL_REVIEWS } from '../data/defaults';
import { ReviewItem } from '../types';

export const Reviews: React.FC = () => {
  const { content } = useStudio();
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [name, setName] = useState('');
  const [service, setService] = useState('Wedding Photography');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'reviews'), where('approved', '==', true)));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewItem));
          setReviews(list);
        }
      } catch (e) {
        // Fallback to defaults
      }
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reviewText.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        customerName: name.trim(),
        service,
        rating,
        reviewText: reviewText.trim(),
        approved: false,
        order: 99,
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowSubmitModal(false);
        setName('');
        setReviewText('');
      }, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="reviews-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
        
        {/* Editorial Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
              PATRON REFLECTIONS
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[64px] font-light leading-[1.08] tracking-tight text-[#1C1C1A]">
            Stories in Their Words
          </h1>

          <p className="text-[16px] lg:text-[17px] text-[#66645F] font-sans leading-relaxed">
            {content.reviewsHeader?.subtitle || 'Reflections and memories shared by couples, families, and creative collaborators documented by 1 by 2 Studio.'}
          </p>

          <div className="pt-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-3 text-[12px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] border border-[#1C1C1A] inline-flex items-center gap-2 hover:bg-[#1C1C1A] hover:text-[#F4F1EC] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit a Reflection</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-8 rounded-[6px] border border-[#D8D2C8] bg-[#E8E3DB]/40 flex flex-col justify-between space-y-6 hover:border-[#6B4F3A] transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#6B4F3A] text-[#6B4F3A]" />
                  ))}
                </div>
                <p className="text-[15px] leading-relaxed text-[#1C1C1A] font-sans italic">
                  "{rev.reviewText}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#D8D2C8]">
                {rev.customerImage ? (
                  <img
                    src={rev.customerImage}
                    alt={rev.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-[#D8D2C8]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1A] text-[#F4F1EC] flex items-center justify-center font-semibold text-xs font-sans">
                    {rev.customerName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold font-sans text-[#1C1C1A]">
                    {rev.customerName}
                  </div>
                  {rev.service && (
                    <div className="text-xs text-[#66645F] font-sans">{rev.service}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Review Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-md w-full p-8 rounded-[6px] border border-[#D8D2C8] bg-[#F4F1EC] space-y-6 relative shadow-2xl">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 p-1 text-[#66645F] hover:text-[#1C1C1A]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold block">
                  COMMISSION FEEDBACK
                </span>
                <h2 className="font-heading text-2xl font-light text-[#1C1C1A]">
                  Share Your Experience
                </h2>
              </div>

              {submitted ? (
                <div className="p-6 rounded-[4px] bg-[#E8E3DB] border border-[#6B4F3A] text-[#1C1C1A] text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6B4F3A] shrink-0" />
                  <span>Thank you. Your reflection has been received and will be published following editorial verification.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya &amp; Arjun"
                      className="w-full px-3 py-2.5 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                      Service Commissioned
                    </label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                    >
                      <option value="Wedding Photography">Wedding Photography</option>
                      <option value="Pre-Wedding &amp; Couple Session">Pre-Wedding &amp; Couple Session</option>
                      <option value="Portrait &amp; Headshots">Portrait &amp; Headshots</option>
                      <option value="Fashion &amp; Editorial">Fashion &amp; Editorial</option>
                      <option value="Event Photography">Event Photography</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                      Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setRating(val)}
                          className="p-1"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              val <= rating ? 'fill-[#6B4F3A] text-[#6B4F3A]' : 'text-[#D8D2C8]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                      Your Reflection *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your thoughts on the creative process and photographs..."
                      className="w-full px-3 py-2.5 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 text-xs font-semibold uppercase text-[#66645F] hover:text-[#1C1C1A]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Post Reflection'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
