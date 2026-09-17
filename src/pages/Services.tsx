import React, { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStudio } from '../context/StudioContext';
import { INITIAL_SERVICES } from '../data/defaults';
import { ServiceItem } from '../types';

interface ServicesProps {
  onNavigate: (page: string, params?: { service?: string }) => void;
}

export const Services: React.FC<ServicesProps> = ({ onNavigate }) => {
  const { content } = useStudio();
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'services'), where('active', '==', true), orderBy('order', 'asc')));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem));
          setServices(list);
        }
      } catch (e) {
        // Fallback to initial services
      }
    };
    fetchServices();
  }, []);

  return (
    <div id="services-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-20">
        
        {/* Editorial Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
              DISCIPLINES &amp; COMMISSIONS
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[64px] font-light leading-[1.08] tracking-tight text-[#1C1C1A]">
            What We Create
          </h1>

          <p className="text-[16px] lg:text-[17px] text-[#66645F] font-sans leading-relaxed">
            {content.servicesHeader?.subtitle || 'Each commission is approached with thoughtful preparation, bespoke lighting, and master color curation to craft heirlooms that outlast fleeting trends.'}
          </p>
        </div>

        {/* Editorial Services List */}
        <div className="space-y-16">
          {services.map((service, idx) => {
            const isEven = idx % 2 === 0;
            const numString = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={service.name + idx}
                id={`service-card-${idx}`}
                className="rounded-[6px] border border-[#D8D2C8] bg-[#F4F1EC] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-8 sm:p-10 transition-all hover:border-[#6B4F3A] hover:shadow-sm"
              >
                {/* Image Col */}
                <div className={`lg:col-span-6 ${isEven ? 'order-1' : 'order-1 lg:order-2'}`}>
                  <div className="relative rounded-[4px] overflow-hidden h-72 sm:h-[420px] bg-[#E8E3DB] film-grain">
                    <img
                      src={service.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80'}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-[#1C1C1A]/85 backdrop-blur-sm text-[#F4F1EC] text-[11px] font-mono tracking-widest rounded-[3px]">
                      {numString}
                    </div>
                  </div>
                </div>

                {/* Content Col */}
                <div className={`lg:col-span-6 space-y-6 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}>
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] font-sans font-semibold text-[#6B4F3A] block">
                      Discipline · {numString}
                    </span>
                    <h2 className="font-heading text-3xl sm:text-4xl text-[#1C1C1A] font-light">
                      {service.name}
                    </h2>
                  </div>

                  <p className="text-[15px] lg:text-[16px] leading-relaxed text-[#66645F] font-sans">
                    {service.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-3 pt-2 text-sm text-[#66645F] font-sans border-t border-[#D8D2C8]/70">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#E8E3DB] flex items-center justify-center text-[#6B4F3A] mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Tailored pre-shoot moodboard curation and location scouting in Chennai / destination</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#E8E3DB] flex items-center justify-center text-[#6B4F3A] mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>Master-grade archival color correction and private high-resolution client gallery</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => onNavigate('booking', { service: service.name })}
                      className="px-7 py-3.5 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] flex items-center gap-3 transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Inquire {service.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="bg-[#202522] text-[#F4F1EC] rounded-[6px] p-10 sm:p-14 text-center space-y-6">
          <span className="text-xs uppercase tracking-[0.25em] text-[#A47C5B] font-semibold block">
            CUSTOM COMMISSIONS
          </span>
          <h3 className="font-heading text-3xl sm:text-4xl font-light max-w-xl mx-auto">
            Have an atypical project or destination concept in mind?
          </h3>
          <p className="text-sm sm:text-base text-[#F4F1EC]/80 max-w-lg mx-auto font-sans leading-relaxed">
            From multi-day cultural destination weddings to intimate studio editorials, we create bespoke coverages for every artistic vision.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="px-8 py-3.5 bg-[#A47C5B] hover:bg-[#b58c69] text-[#1C1C1A] font-semibold text-[13px] font-sans uppercase tracking-[0.08em] rounded-[4px] transition-colors"
          >
            Start a Conversation
          </button>
        </div>

      </div>
    </div>
  );
};
