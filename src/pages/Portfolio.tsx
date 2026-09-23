import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ArrowUpRight, Eye, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStudio } from '../context/StudioContext';
import { DEFAULT_CATEGORIES, INITIAL_PORTFOLIO } from '../data/defaults';
import { PortfolioItem, PortfolioCategory } from '../types';

export const Portfolio: React.FC = () => {
  const { content } = useStudio();
  const [items, setItems] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);

  const categories = ['ALL', 'WEDDINGS', 'COUPLES', 'PORTRAITS', 'FASHION', 'EVENTS'];

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const itemSnap = await getDocs(query(collection(db, 'portfolio'), where('visible', '==', true)));
        if (!itemSnap.empty) {
          const list = itemSnap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem));
          setItems(list);
        }
      } catch (e) {
        // Fallback to INITIAL_PORTFOLIO
      }
    };

    fetchPortfolio();
  }, []);

  const filteredItems = activeCategory === 'ALL'
    ? items
    : items.filter(it => {
        const cat = (it.category || '').toUpperCase();
        if (activeCategory === 'WEDDINGS') return cat.includes('WEDDING');
        if (activeCategory === 'COUPLES') return cat.includes('COUPLE') || cat.includes('PRE-WEDDING');
        if (activeCategory === 'PORTRAITS') return cat.includes('PORTRAIT');
        if (activeCategory === 'FASHION') return cat.includes('FASHION');
        if (activeCategory === 'EVENTS') return cat.includes('EVENT');
        return cat === activeCategory;
      });

  return (
    <div id="portfolio-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
        
        {/* Editorial Page Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
              ARCHIVE &amp; COMMISSIONS
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[64px] font-light leading-[1.08] tracking-tight text-[#1C1C1A]">
            Selected Works
          </h1>

          <p className="text-[16px] lg:text-[17px] text-[#66645F] font-sans leading-relaxed">
            {content.portfolioHeader?.subtitle || 'An editorial curation of weddings, intimate couple stories, and fine-art portraits documented across Chennai, Tamil Nadu, and destination venues.'}
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-[#D8D2C8]">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                id={`portfolio-cat-${cat.toLowerCase()}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 text-[12px] font-sans uppercase tracking-[0.1em] rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1C1A] text-[#F4F1EC] font-semibold shadow-sm'
                    : 'bg-transparent text-[#66645F] hover:text-[#1C1C1A] border border-[#D8D2C8]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Editorial Masonry / Asymmetric Composition */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {filteredItems.map((item, idx) => {
            // Asymmetric rhythm: alternating 7-col and 5-col, or large 12-col spotlight
            const isWide = idx % 5 === 0;
            const isMedium = idx % 5 === 1 || idx % 5 === 2;
            const colSpan = isWide ? 'md:col-span-12 lg:col-span-8' : isMedium ? 'md:col-span-6 lg:col-span-4' : 'md:col-span-6';
            const height = isWide ? 'h-[460px] sm:h-[560px]' : 'h-[380px] sm:h-[460px]';

            return (
              <div
                key={item.title + idx}
                id={`portfolio-item-${idx}`}
                className={`group relative rounded-[6px] overflow-hidden border border-[#D8D2C8] bg-[#E8E3DB] ${colSpan} ${height} cursor-pointer`}
                onClick={() => setLightboxItem(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />

                {/* Dark Transparent Overlay on Hover */}
                <div className="absolute inset-0 bg-[#202522]/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1.5px]" />

                {/* Editorial Content on Hover */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#F4F1EC]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#F4F1EC]/80 font-semibold">
                      {item.category}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-[#F4F1EC] text-[#1C1C1A] flex items-center justify-center shadow">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-heading text-2xl sm:text-3xl font-light">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[#F4F1EC]/80 line-clamp-2 max-w-lg font-sans">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile caption always visible */}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#1C1C1A]/75 backdrop-blur-sm rounded text-[11px] text-[#F4F1EC] font-sans block md:hidden">
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-24 text-[#66645F] font-sans">
            No works found under this category.
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          id="portfolio-lightbox-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-[#F4F1EC] rounded-[6px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#1C1C1A]/80 text-white flex items-center justify-center hover:bg-[#1C1C1A]"
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="md:w-2/3 bg-black flex items-center justify-center max-h-[55vh] md:max-h-[85vh]">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="md:w-1/3 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold block">
                  {lightboxItem.category}
                </span>
                <h2 className="font-heading text-3xl font-light text-[#1C1C1A]">
                  {lightboxItem.title}
                </h2>
                <p className="text-sm text-[#66645F] leading-relaxed font-sans">
                  {lightboxItem.description || 'Captured with natural ambient light and fine-art editorial color grading for 1 by 2 Studio.'}
                </p>
                <div className="pt-2 text-xs text-[#66645F]">
                  <span>Location: Chennai &amp; Tamil Nadu</span>
                </div>
              </div>

              <div className="pt-6 border-t border-[#D8D2C8] space-y-3">
                <button
                  onClick={() => {
                    setLightboxItem(null);
                    window.location.href = '#/booking';
                  }}
                  className="w-full py-3 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans uppercase tracking-[0.08em] font-medium rounded-[4px] transition-colors"
                >
                  Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
