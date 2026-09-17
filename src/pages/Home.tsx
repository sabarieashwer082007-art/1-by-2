import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, X, Sparkles, Eye } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStudio } from '../context/StudioContext';
import { INITIAL_SERVICES, INITIAL_PORTFOLIO, INITIAL_REVIEWS } from '../data/defaults';
import { ServiceItem, PortfolioItem, ReviewItem } from '../types';

interface HomeProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { siteSettings, content } = useStudio();
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState<number>(0);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    // Dynamic services
    const fetchServices = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'services'), where('active', '==', true), orderBy('order', 'asc')));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem));
          setServices(list);
        }
      } catch (e) {
        // Fallback to INITIAL_SERVICES
      }
    };

    // Dynamic portfolio
    const fetchPortfolio = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'portfolio'), where('visible', '==', true)));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem));
          setPortfolioItems(list);
        }
      } catch (e) {
        // Fallback to INITIAL_PORTFOLIO
      }
    };

    // Dynamic reviews
    const fetchReviews = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'reviews'), where('approved', '==', true)));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewItem));
          setReviews(list);
        }
      } catch (e) {
        // Fallback to INITIAL_REVIEWS
      }
    };

    fetchServices();
    fetchPortfolio();
    fetchReviews();
  }, []);

  const categories = ['ALL', 'WEDDINGS', 'COUPLES', 'PORTRAITS', 'FASHION', 'EVENTS'];

  const filteredPortfolio = activeCategory === 'ALL'
    ? portfolioItems
    : portfolioItems.filter(item => {
        const cat = (item.category || '').toUpperCase();
        if (activeCategory === 'WEDDINGS') return cat.includes('WEDDING');
        if (activeCategory === 'COUPLES') return cat.includes('COUPLE') || cat.includes('PRE-WEDDING');
        if (activeCategory === 'PORTRAITS') return cat.includes('PORTRAIT');
        if (activeCategory === 'FASHION') return cat.includes('FASHION');
        if (activeCategory === 'EVENTS') return cat.includes('EVENT');
        return cat === activeCategory;
      });

  const nextTestimonial = () => {
    setActiveTestimonialIdx((prev) => (prev + 1) % reviews.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonialIdx((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const currentReview = reviews[activeTestimonialIdx] || reviews[0];

  return (
    <div id="home-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] selection:bg-[#6B4F3A] selection:text-[#F4F1EC]">
      {/* =========================================================================
          1. HERO SECTION (Asymmetric, Editorial, Grain, Distinct composition)
          ========================================================================= */}
      <section id="hero-section" className="relative min-h-[90vh] flex items-center pt-8 pb-20 overflow-hidden border-b border-[#D8D2C8]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* LEFT: Editorial Typography & CTAs */}
            <div className="lg:col-span-6 space-y-8 z-10">
              <div className="inline-flex items-center gap-3">
                <span className="w-8 h-[1px] bg-[#6B4F3A]" />
                <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
                  CHENNAI · INDIA
                </span>
              </div>

              <h1 className="font-heading text-[38px] sm:text-[48px] lg:text-[72px] leading-[1.04] tracking-[-0.01em] text-[#1C1C1A] font-light">
                Stories <br />
                <span className="font-serif italic font-normal text-[#6B4F3A]">worth</span> <br />
                remembering.
              </h1>

              <p className="text-[16px] lg:text-[17px] leading-[1.65] text-[#66645F] max-w-lg font-sans">
                We create photographs that preserve the atmosphere, emotion and character of your most meaningful moments.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <button
                  id="hero-cta-view-work"
                  onClick={() => onNavigate('portfolio')}
                  className="px-8 py-4 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>VIEW OUR WORK</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="hero-cta-start-conversation"
                  onClick={() => onNavigate('contact')}
                  className="px-8 py-4 bg-transparent hover:bg-[#E8E3DB] border border-[#1C1C1A] text-[#1C1C1A] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>START A CONVERSATION</span>
                </button>
              </div>

              {/* Subtext info */}
              <div className="pt-6 border-t border-[#D8D2C8]/60 flex items-center gap-8 text-xs text-[#66645F] tracking-wide">
                <div>
                  <span className="text-[#1C1C1A] font-semibold block text-sm font-heading">Bespoke Inquiries</span>
                  <span>Direct phone line open daily</span>
                </div>
                <div className="h-8 w-[1px] bg-[#D8D2C8]" />
                <div>
                  <span className="text-[#1C1C1A] font-semibold block text-sm font-heading">Tamil Nadu &amp; Beyond</span>
                  <span>Available for destination journeys</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Large Cinematic Editorial Image with Film Grain */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Visual frame accent */}
                <div className="absolute -top-4 -right-4 w-full h-full border border-[#6B4F3A]/25 rounded-[6px] hidden sm:block pointer-events-none" />
                
                <div className="relative rounded-[6px] overflow-hidden shadow-2xl film-grain bg-[#E8E3DB]">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85"
                    alt="1 by 2 Studio Chennai Editorial Portraiture"
                    className="w-full h-[460px] sm:h-[560px] object-cover object-center filter contrast-[1.02] brightness-[0.98] transition-transform duration-1000 ease-out hover:scale-[1.02]"
                  />
                  {/* Subtle warm vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#202522]/60 via-transparent to-transparent opacity-80" />

                  {/* Corner caption overlay */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#F4F1EC]/90 backdrop-blur-md border border-[#D8D2C8] rounded-[4px] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold block">
                        Commission No. 418
                      </span>
                      <span className="font-heading text-base font-medium text-[#1C1C1A]">
                        The Mandap Glow · Chennai
                      </span>
                    </div>
                    <span className="text-xs text-[#66645F] font-sans">1 by 2 Studio</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. INTRODUCTION SECTION (Editorial two-column, Philosophy + Real Statistics)
          ========================================================================= */}
      <section id="approach-section" className="py-24 sm:py-32 border-b border-[#D8D2C8] bg-[#F4F1EC]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left: Large Typography Headline */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#6B4F3A] font-semibold block">
                01 — OUR APPROACH
              </span>
              <h2 className="font-heading text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.12] tracking-[-0.01em] text-[#1C1C1A] font-light">
                "Photography is not just about what happened. <br className="hidden sm:block" />
                <span className="italic text-[#6B4F3A] font-serif">It's about how it felt."</span>
              </h2>
            </div>

            {/* Right: Paragraph + Statistics */}
            <div className="lg:col-span-5 space-y-10 pt-2">
              <p className="text-[16px] lg:text-[17px] leading-[1.7] text-[#66645F] font-sans">
                At 1 by 2 Studio, our visual approach is anchored in quiet observation and cinematic depth. Rather than manufacturing artificial poses, we harmonize with the natural cadence of your celebration—preserving fleeting glances, delicate vulnerabilities, and genuine human warmth in heirloom form.
              </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#D8D2C8]">
                <div>
                  <div className="font-heading text-4xl sm:text-5xl font-light text-[#1C1C1A]">
                    500+
                  </div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#66645F] mt-1 font-sans">
                    Stories captured
                  </div>
                </div>

                <div>
                  <div className="font-heading text-4xl sm:text-5xl font-light text-[#1C1C1A]">
                    8+
                  </div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#66645F] mt-1 font-sans">
                    Years creating
                  </div>
                </div>

                <div>
                  <div className="font-heading text-4xl sm:text-5xl font-light text-[#1C1C1A]">
                    120+
                  </div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#66645F] mt-1 font-sans">
                    Happy couples
                  </div>
                </div>

                <div>
                  <div className="font-heading text-4xl sm:text-5xl font-light text-[#6B4F3A]">
                    Chennai
                  </div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#66645F] mt-1 font-sans">
                    Based in Tamil Nadu
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SERVICES SECTION ("WHAT WE CREATE" - Editorial Service Cards)
          ========================================================================= */}
      <section id="services-section" className="py-24 sm:py-32 border-b border-[#D8D2C8] bg-[#E8E3DB]/40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-3">
              <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#6B4F3A] font-semibold block">
                DISCIPLINES &amp; OFFERINGS
              </span>
              <h2 className="font-heading text-[32px] sm:text-[40px] lg:text-[52px] leading-tight text-[#1C1C1A] font-light">
                WHAT WE CREATE
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[#66645F] max-w-md font-sans leading-relaxed">
              Curated visual storytelling crafted with refined lighting, master color grading, and intimate editorial direction.
            </p>
          </div>

          {/* Editorial Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const numString = String(index + 1).padStart(2, '0');
              return (
                <div
                  key={service.name}
                  onClick={() => onNavigate('booking', { service: service.name })}
                  className="group bg-[#F4F1EC] rounded-[6px] border border-[#D8D2C8] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#6B4F3A] hover:shadow-md cursor-pointer"
                >
                  {/* Image with subtle zoom on hover */}
                  <div className="relative h-64 overflow-hidden bg-[#E8E3DB]">
                    <img
                      src={service.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 px-2.5 py-1 bg-[#1C1C1A]/80 backdrop-blur-sm text-[#F4F1EC] text-[11px] font-mono tracking-widest rounded-[3px]">
                      {numString}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h3 className="font-heading text-2xl font-semibold text-[#1C1C1A] group-hover:text-[#6B4F3A] transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-[14px] leading-relaxed text-[#66645F] font-sans">
                        {service.description}
                      </p>
                    </div>

                    {/* Arrow animation */}
                    <div className="pt-4 border-t border-[#D8D2C8]/70 flex items-center justify-between text-xs font-sans uppercase tracking-[0.1em] text-[#1C1C1A] group-hover:text-[#6B4F3A]">
                      <span className="font-semibold">Inquire Availability</span>
                      <ArrowRight className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom link */}
          <div className="text-center mt-14">
            <button
              onClick={() => onNavigate('services')}
              className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-[0.14em] font-semibold text-[#1C1C1A] hover:text-[#6B4F3A] border-b border-[#1C1C1A] pb-1 transition-colors"
            >
              <span>Explore all service scopes &amp; deliverables</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* =========================================================================
          4. PORTFOLIO SECTION (Editorial Masonry / Grid with Categories)
          ========================================================================= */}
      <section id="portfolio-section" className="py-24 sm:py-32 border-b border-[#D8D2C8] bg-[#F4F1EC]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3">
              <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#6B4F3A] font-semibold block">
                SELECTED COMMISSIONS
              </span>
              <h2 className="font-heading text-[32px] sm:text-[40px] lg:text-[52px] leading-tight text-[#1C1C1A] font-light">
                Visual Portfolio
              </h2>
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 text-[12px] font-sans uppercase tracking-[0.1em] rounded-full transition-all cursor-pointer ${
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
          </div>

          {/* Asymmetric Editorial Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {filteredPortfolio.map((item, index) => {
              // Asymmetric sizing: item 0 and item 3 take 7 columns, others take 5 columns for magazine look
              const isFeature = index % 3 === 0;
              const colSpanClass = isFeature ? 'md:col-span-7' : 'md:col-span-5';
              const heightClass = isFeature ? 'h-[440px] sm:h-[500px]' : 'h-[360px] sm:h-[500px]';

              return (
                <div
                  key={item.title + index}
                  onClick={() => setLightboxItem(item)}
                  className={`group relative rounded-[6px] overflow-hidden border border-[#D8D2C8] bg-[#E8E3DB] ${colSpanClass} ${heightClass} cursor-pointer`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Dark Transparent Overlay on Hover */}
                  <div className="absolute inset-0 bg-[#202522]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]" />

                  {/* Content Reveal on Hover */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#F4F1EC]/80 font-semibold">
                        {item.category}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-[#F4F1EC] text-[#1C1C1A] flex items-center justify-center shadow">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-heading text-2xl sm:text-3xl text-[#F4F1EC] font-normal">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-[#F4F1EC]/80 line-clamp-2 max-w-md font-sans">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Always-visible subtle corner tag on mobile */}
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#1C1C1A]/70 backdrop-blur-sm rounded text-[11px] text-[#F4F1EC] font-sans block sm:hidden">
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Gallery Navigation */}
          <div className="text-center mt-16">
            <button
              onClick={() => onNavigate('portfolio')}
              className="px-8 py-4 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 shadow-sm inline-flex items-center gap-2"
            >
              <span>VIEW FULL GALLERY VAULT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. FEATURED STORY (Cinematic Full-Width Section)
          ========================================================================= */}
      <section id="featured-story-section" className="relative min-h-[75vh] flex items-center justify-center overflow-hidden border-b border-[#D8D2C8]">
        {/* Full-width photography */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=2000&q=85"
            alt="An evening by the coast - Chennai Pre-Wedding Story"
            className="w-full h-full object-cover object-center filter contrast-[1.05]"
          />
          {/* Subtle dark overlay */}
          <div className="absolute inset-0 bg-[#202522]/65 backdrop-blur-[1px]" />
        </div>

        {/* Story Overlay Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 py-20 text-center text-[#F4F1EC] space-y-6">
          <span className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-[#A47C5B] block">
            FEATURED STORY · AN EVENING BY THE COAST
          </span>

          <h2 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.08] tracking-tight">
            "Where Chennai <br />
            <span className="italic font-serif text-[#A47C5B]">meets the sea."</span>
          </h2>

          <p className="text-base sm:text-lg text-[#F4F1EC]/85 max-w-2xl mx-auto font-sans leading-relaxed">
            A dusk celebration along the Coromandel coast. Salty sea mist, handloom textiles caught in offshore breeze, and two souls completely absorbed in each other's quiet laughter.
          </p>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('portfolio')}
              className="px-8 py-4 bg-[#F4F1EC] hover:bg-[#A47C5B] text-[#1C1C1A] hover:text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 shadow-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <span>EXPLORE STORY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. WHY CHOOSE US (4 Editorial Blocks - Studio Personality)
          ========================================================================= */}
      <section id="why-choose-us-section" className="py-24 sm:py-32 border-b border-[#D8D2C8] bg-[#F4F1EC]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="max-w-2xl mb-16 space-y-3">
            <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#6B4F3A] font-semibold block">
              STUDIO SIGNATURE
            </span>
            <h2 className="font-heading text-[32px] sm:text-[40px] lg:text-[52px] leading-tight text-[#1C1C1A] font-light">
              Crafting Without Compromise
            </h2>
          </div>

          {/* 4 Editorial Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Block 01 */}
            <div className="space-y-4 pt-6 border-t border-[#1C1C1A]">
              <span className="font-heading text-4xl sm:text-5xl text-[#6B4F3A] font-light block">
                01
              </span>
              <h3 className="font-heading text-2xl font-semibold text-[#1C1C1A]">
                Authentic Moments
              </h3>
              <p className="text-sm leading-relaxed text-[#66645F] font-sans">
                We eliminate stiff choreography in favor of unobtrusive documentation. The moments you cherish most are the ones you didn't know were being captured.
              </p>
            </div>

            {/* Block 02 */}
            <div className="space-y-4 pt-6 border-t border-[#1C1C1A]">
              <span className="font-heading text-4xl sm:text-5xl text-[#6B4F3A] font-light block">
                02
              </span>
              <h3 className="font-heading text-2xl font-semibold text-[#1C1C1A]">
                Cinematic Visuals
              </h3>
              <p className="text-sm leading-relaxed text-[#66645F] font-sans">
                Trained in narrative motion and high-fashion lighting, we compose each frame with deep shadows, rich tonal balance, and organic film grain.
              </p>
            </div>

            {/* Block 03 */}
            <div className="space-y-4 pt-6 border-t border-[#1C1C1A]">
              <span className="font-heading text-4xl sm:text-5xl text-[#6B4F3A] font-light block">
                03
              </span>
              <h3 className="font-heading text-2xl font-semibold text-[#1C1C1A]">
                Personal Direction
              </h3>
              <p className="text-sm leading-relaxed text-[#66645F] font-sans">
                Before the shutter clicks, we spend time understanding your dynamic, family rituals, and preferred aesthetic to curate tailored moodboards.
              </p>
            </div>

            {/* Block 04 */}
            <div className="space-y-4 pt-6 border-t border-[#1C1C1A]">
              <span className="font-heading text-4xl sm:text-5xl text-[#6B4F3A] font-light block">
                04
              </span>
              <h3 className="font-heading text-2xl font-semibold text-[#1C1C1A]">
                Timeless Editing
              </h3>
              <p className="text-sm leading-relaxed text-[#66645F] font-sans">
                We avoid ephemeral social media filters. Our archival color-correction preserves true South Indian skin tones and textural fidelity for decades.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. TESTIMONIALS (Large Quotation Typography & Horizontal Slider)
          ========================================================================= */}
      <section id="testimonials-section" className="py-24 sm:py-32 border-b border-[#D8D2C8] bg-[#E8E3DB]/50">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-10">
          <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#6B4F3A] font-semibold block">
            PATRON REFLECTIONS
          </span>

          <div className="min-h-[160px] flex items-center justify-center">
            <blockquote className="font-heading text-2xl sm:text-4xl lg:text-[44px] leading-[1.25] text-[#1C1C1A] font-light italic">
              "{currentReview?.reviewText || 'The photographs don\'t just show the day. They bring us back to it.'}"
            </blockquote>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-sans font-semibold uppercase tracking-[0.14em] text-[#1C1C1A]">
              — {currentReview?.customerName || 'Priya & Siddharth Raman'}
            </div>
            {currentReview?.service && (
              <div className="text-xs text-[#66645F] font-sans">
                {currentReview.service} · Chennai
              </div>
            )}
          </div>

          {/* Slider controls */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              onClick={prevTestimonial}
              className="w-11 h-11 rounded-full border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] hover:border-[#1C1C1A] flex items-center justify-center transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-[#66645F]">
              {activeTestimonialIdx + 1} / {reviews.length}
            </span>
            <button
              onClick={nextTestimonial}
              className="w-11 h-11 rounded-full border border-[#D8D2C8] bg-[#F4F1EC] text-[#1C1C1A] hover:border-[#1C1C1A] flex items-center justify-center transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. ABOUT SECTION (Personal Studio Section, Image + Text)
          ========================================================================= */}
      <section id="about-section" className="py-24 sm:py-32 border-b border-[#D8D2C8] bg-[#F4F1EC]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Image side */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-[6px] overflow-hidden border border-[#D8D2C8] shadow-lg film-grain bg-[#E8E3DB]">
                <img
                  src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85"
                  alt="1 by 2 Studio Founders &amp; Equipment"
                  className="w-full h-[480px] sm:h-[540px] object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#F4F1EC]/90 backdrop-blur-md border border-[#D8D2C8] rounded-[4px]">
                  <span className="font-heading text-base font-semibold text-[#1C1C1A] block">
                    Chennai, Tamil Nadu
                  </span>
                  <span className="text-xs text-[#66645F] font-sans">
                    Available for destination projects worldwide
                  </span>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-sans uppercase tracking-[0.25em] text-[#6B4F3A] font-semibold block">
                BEHIND THE CAMERA
              </span>

              <h2 className="font-heading text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.12] text-[#1C1C1A] font-light">
                "Behind the camera, <br />
                <span className="italic font-serif text-[#6B4F3A]">there is a story too."</span>
              </h2>

              <p className="text-[16px] lg:text-[17px] leading-[1.7] text-[#66645F] font-sans">
                {content.about.story || 'Founded in Chennai with a passion for architectural symmetry, natural South Indian light, and candid human connection, 1 by 2 Studio is dedicated to elevating personal milestones into timeless editorial art.'}
              </p>

              <p className="text-[15px] leading-relaxed text-[#66645F] font-sans">
                We believe the most memorable photographs are not simply sharp images, but emotional vessels that allow you to relive the breath, music, and unspoken glances of your day years from now.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={() => onNavigate('about')}
                  className="px-6 py-3 border border-[#1C1C1A] hover:bg-[#1C1C1A] hover:text-[#F4F1EC] text-[#1C1C1A] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all"
                >
                  Read Studio Story
                </button>

                <a
                  href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
                  className="text-[13px] font-sans text-[#6B4F3A] hover:underline font-semibold"
                >
                  Call the Studio Director: {siteSettings.phone}
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          9. CONTACT / BOOKING CTA (Dark Section #202522, Text #F4F1EC, Accent #A47C5B)
          ========================================================================= */}
      <section id="cta-section" className="py-24 sm:py-32 bg-[#202522] text-[#F4F1EC]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-8">
          <span className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-[#A47C5B] block">
            RESERVATIONS &amp; CONSULTATIONS
          </span>

          <h2 className="font-heading text-4xl sm:text-6xl lg:text-[64px] font-light leading-[1.1] tracking-tight">
            "Let's create something <br />
            <span className="italic font-serif text-[#A47C5B]">you'll want to remember."</span>
          </h2>

          <p className="text-base sm:text-lg text-[#F4F1EC]/80 max-w-xl mx-auto font-sans leading-relaxed">
            Tell us about your story, your date and what you have in mind. We accept a limited number of commissions each season to ensure obsessive focus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <button
              id="cta-start-conversation-btn"
              onClick={() => onNavigate('contact')}
              className="w-full sm:w-auto px-8 py-4 bg-[#A47C5B] hover:bg-[#b58c69] text-[#1C1C1A] font-semibold text-[13px] font-sans uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 shadow-xl cursor-pointer"
            >
              START A CONVERSATION
            </button>

            <button
              id="cta-book-session-btn"
              onClick={() => onNavigate('booking')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/10 border border-[#F4F1EC]/40 text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 cursor-pointer"
            >
              BOOK A SESSION
            </button>
          </div>

          <div className="pt-8 text-xs text-[#F4F1EC]/60 space-y-1">
            <p>Chennai, Tamil Nadu · Direct WhatsApp &amp; Calls: {siteSettings.phone}</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIGHTBOX MODAL FOR PORTFOLIO
          ========================================================================= */}
      {lightboxItem && (
        <div
          id="portfolio-lightbox"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
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

            <div className="md:w-2/3 bg-black flex items-center justify-center max-h-[60vh] md:max-h-[85vh]">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="md:w-1/3 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold">
                  {lightboxItem.category}
                </span>
                <h3 className="font-heading text-3xl text-[#1C1C1A]">
                  {lightboxItem.title}
                </h3>
                <p className="text-sm text-[#66645F] leading-relaxed font-sans">
                  {lightboxItem.description || 'Captured with natural ambient lighting and medium format sensor depth for 1 by 2 Studio.'}
                </p>
              </div>

              <div className="pt-6 border-t border-[#D8D2C8] space-y-3">
                <button
                  onClick={() => {
                    setLightboxItem(null);
                    onNavigate('booking');
                  }}
                  className="w-full py-3 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans uppercase tracking-[0.08em] font-medium rounded-[4px] transition-colors"
                >
                  Inquire Similar Commission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
