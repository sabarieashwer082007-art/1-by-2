import React from 'react';
import { Lock, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { siteSettings } = useStudio();

  return (
    <footer
      id="main-studio-footer"
      className="bg-[#E8E3DB]/70 border-t border-[#D8D2C8] text-[#1C1C1A] pt-20 pb-12 transition-colors font-sans"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-[#D8D2C8]">
          
          {/* Col 1: Brand & Location (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <button
              onClick={() => onNavigate('home')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="font-heading text-3xl font-light text-[#1C1C1A] block tracking-wide group-hover:text-[#6B4F3A] transition-colors">
                1 by 2 Studio
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#66645F] font-medium block mt-1">
                Chennai, Tamil Nadu
              </span>
            </button>

            <p className="text-[15px] leading-relaxed text-[#66645F] max-w-sm">
              An artistic Chennai photography studio crafting cinematic, emotionally powerful and timeless visual stories for weddings, portraits, and editorial commissions.
            </p>

            <div className="pt-2">
              <span className="text-xs uppercase tracking-[0.15em] text-[#6B4F3A] font-semibold block mb-1">
                Studio Address
              </span>
              <p className="text-xs text-[#66645F] leading-relaxed max-w-xs">
                {siteSettings.address || 'Chennai, Tamil Nadu, India'}
              </p>
            </div>
          </div>

          {/* Col 2: Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#1C1C1A] font-semibold">
              Explorations
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  id="footer-nav-work"
                  onClick={() => onNavigate('portfolio')}
                  className="text-[#66645F] hover:text-[#1C1C1A] transition-colors text-left"
                >
                  Work
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-services"
                  onClick={() => onNavigate('services')}
                  className="text-[#66645F] hover:text-[#1C1C1A] transition-colors text-left"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-about"
                  onClick={() => onNavigate('about')}
                  className="text-[#66645F] hover:text-[#1C1C1A] transition-colors text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-stories"
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => {
                      const el = document.getElementById('featured-story-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="text-[#66645F] hover:text-[#1C1C1A] transition-colors text-left"
                >
                  Stories
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-contact"
                  onClick={() => onNavigate('contact')}
                  className="text-[#66645F] hover:text-[#1C1C1A] transition-colors text-left"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-booking"
                  onClick={() => onNavigate('booking')}
                  className="text-[#6B4F3A] hover:underline font-medium text-left inline-flex items-center gap-1"
                >
                  <span>Book a Session</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Contact & Social (4 cols) */}
          <div className="md:col-span-4 space-y-6">
            <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#1C1C1A] font-semibold">
              Inquiries &amp; Atelier
            </h4>

            <div className="space-y-3 text-sm text-[#66645F]">
              <div>
                <span className="text-xs text-[#66645F] block">Telephone &amp; WhatsApp:</span>
                <a
                  href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
                  className="text-base font-semibold text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors"
                >
                  {siteSettings.phone}
                </a>
              </div>

              <div>
                <span className="text-xs text-[#66645F] block">Electronic Mail:</span>
                <a
                  href={`mailto:${siteSettings.email}`}
                  className="text-sm text-[#1C1C1A] hover:underline"
                >
                  {siteSettings.email}
                </a>
              </div>
            </div>

            {/* Social Links: Instagram, YouTube */}
            <div className="pt-2 space-y-3">
              <span className="text-xs uppercase tracking-[0.15em] text-[#66645F] block font-medium">
                Social Archives
              </span>
              <div className="flex items-center gap-4">
                <a
                  href={siteSettings.instagram || 'https://instagram.com'}
                  target="_blank"
                  rel="noreferrer"
                  id="footer-instagram-link"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>

                <span className="text-[#D8D2C8]">·</span>

                <a
                  href={siteSettings.youtube || 'https://youtube.com'}
                  target="_blank"
                  rel="noreferrer"
                  id="footer-youtube-link"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Admin Portal Link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#66645F]">
          <div>
            © {new Date().getFullYear()} 1 by 2 Studio. Chennai, Tamil Nadu. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <button
              id="footer-admin-login-link"
              onClick={() => onNavigate('admin-login')}
              className="inline-flex items-center gap-1.5 text-[#6B4F3A] hover:text-[#1C1C1A] transition-colors font-medium focus:outline-none cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
