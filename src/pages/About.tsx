import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const { content, siteSettings } = useStudio();

  const processSteps = [
    {
      num: '01',
      title: 'Consultation & Concept Curation',
      desc: 'We discuss your moodboard, wardrobe palette, personal aesthetics, and desired lighting atmosphere to establish the creative blueprint.',
    },
    {
      num: '02',
      title: 'The Photography Session',
      desc: 'Directed with effortless warmth and gentle organic cues. We create an unhurried, comfortable space allowing natural chemistry to flourish.',
    },
    {
      num: '03',
      title: 'Master Retouching & Color Grading',
      desc: 'Each proof is individually color-corrected, calibrated for skin tone fidelity, and refined to archival gallery standards.',
    },
    {
      num: '04',
      title: 'High-Resolution Vault Delivery',
      desc: 'Receive private cloud gallery access with full-resolution downloads, shareable invite links, and bespoke heirloom album print options.',
    },
  ];

  return (
    <div id="about-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-24">
        
        {/* Editorial Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
              OUR ATELIER &amp; PHILOSOPHY
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[64px] font-light leading-[1.08] tracking-tight text-[#1C1C1A]">
            Dedicated to the poetry of human emotion.
          </h1>

          <p className="text-[16px] lg:text-[17px] text-[#66645F] font-sans leading-relaxed">
            At 1 by 2 Studio, photography is not an industrial service; it is an intimate art form preserving the irreplaceable cadence and genuine warmth of life.
          </p>
        </div>

        {/* Story & Visuals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-[6px] overflow-hidden border border-[#D8D2C8] shadow-lg film-grain bg-[#E8E3DB]">
              <img
                src={content.about.image || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85'}
                alt={siteSettings.studioName}
                className="w-full h-[520px] object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#F4F1EC]/90 backdrop-blur-md border border-[#D8D2C8] rounded-[4px]">
                <span className="font-heading text-base font-semibold text-[#1C1C1A] block">
                  1 by 2 Studio Atelier · Chennai
                </span>
                <span className="text-xs text-[#66645F] font-sans">
                  Crafting cinematic heirlooms across Tamil Nadu &amp; destination spaces worldwide.
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.2em] font-sans font-semibold text-[#6B4F3A] block">
                THE STUDIO STORY
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-[#1C1C1A]">
                Born from a reverence for light and heritage.
              </h2>
              <p className="text-[16px] text-[#66645F] font-sans leading-relaxed">
                {content.about.story}
              </p>
            </div>

            <div className="p-7 rounded-[6px] border border-[#D8D2C8] bg-[#E8E3DB]/40 space-y-2">
              <h3 className="font-heading text-xl font-semibold text-[#1C1C1A]">
                Our Guiding Mission
              </h3>
              <p className="text-sm text-[#66645F] font-sans leading-relaxed">
                {content.about.mission}
              </p>
            </div>

            <div className="p-7 rounded-[6px] border border-[#D8D2C8] bg-[#E8E3DB]/40 space-y-2">
              <h3 className="font-heading text-xl font-semibold text-[#1C1C1A]">
                Artistic Philosophy
              </h3>
              <p className="text-sm text-[#66645F] font-sans leading-relaxed">
                {content.about.philosophy}
              </p>
            </div>
          </div>
        </div>

        {/* The 4-Step Process */}
        <div className="space-y-12 pt-8">
          <div className="max-w-xl space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A] block">
              EXPERIENCE BLUEPRINT
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-[#1C1C1A]">
              Our Curated Process
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step) => (
              <div
                key={step.num}
                className="p-8 rounded-[6px] border border-[#D8D2C8] bg-[#F4F1EC] hover:border-[#6B4F3A] transition-colors flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <span className="font-heading text-4xl text-[#6B4F3A] font-light block">
                    {step.num}
                  </span>
                  <h3 className="font-heading text-xl font-semibold text-[#1C1C1A]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#66645F] leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#202522] text-[#F4F1EC] rounded-[6px] p-10 sm:p-14 text-center space-y-6">
          <h2 className="font-heading text-3xl sm:text-4xl font-light">
            Begin your journey with 1 by 2 Studio
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#F4F1EC]/80 font-sans leading-relaxed">
            Our principal photographers and portrait artists are ready to bring your vision into everlasting focus.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('booking')}
              className="px-8 py-3.5 bg-[#A47C5B] hover:bg-[#b58c69] text-[#1C1C1A] font-semibold text-[13px] font-sans uppercase tracking-[0.08em] rounded-[4px] cursor-pointer transition-colors"
            >
              Check Session Availability
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
