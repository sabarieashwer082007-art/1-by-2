import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { siteSettings } = useStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navCenterItems = [
    { id: 'portfolio', label: 'Work' },
    { id: 'services', label: 'Services' },
    { id: 'stories', label: 'Stories', target: 'home' },
    { id: 'about', label: 'About' },
  ];

  const handleNavClick = (id: string, target?: string) => {
    if (id === 'stories') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('featured-story-section') || document.getElementById('portfolio-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      onNavigate(target || id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      id="main-studio-header"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F4F1EC] border-b border-[#D8D2C8] shadow-sm py-3.5'
          : 'bg-[#F4F1EC]/90 backdrop-blur-md border-b border-[#D8D2C8]/60 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* LEFT: 1 by 2 Studio Wordmark */}
        <button
          id="nav-brand-logo"
          onClick={() => onNavigate('home')}
          className="text-left group focus:outline-none cursor-pointer"
        >
          <span className="font-heading text-2xl sm:text-[26px] tracking-wide text-[#1C1C1A] block font-semibold leading-tight group-hover:text-[#6B4F3A] transition-colors">
            1 by 2 Studio
          </span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#66645F] block font-sans font-medium">
            Chennai · Fine Art &amp; Stories
          </span>
        </button>

        {/* CENTER: Desktop Editorial Navigation */}
        <nav id="desktop-nav-links" className="hidden md:flex items-center gap-10">
          {navCenterItems.map((item) => {
            const isActive =
              currentPage === item.id || (item.id === 'stories' && currentPage === 'home');
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id, item.target)}
                className={`text-[13px] font-sans uppercase tracking-[0.12em] transition-all relative py-1 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'text-[#1C1C1A] font-semibold'
                    : 'text-[#66645F] hover:text-[#1C1C1A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#6B4F3A] transition-all" />
                )}
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Contact + Book a Session */}
        <div className="hidden md:flex items-center gap-6">
          <button
            id="nav-link-contact"
            onClick={() => onNavigate('contact')}
            className={`text-[13px] font-sans uppercase tracking-[0.12em] transition-colors focus:outline-none cursor-pointer ${
              currentPage === 'contact'
                ? 'text-[#1C1C1A] font-semibold'
                : 'text-[#66645F] hover:text-[#1C1C1A]'
            }`}
          >
            Contact
          </button>

          <button
            id="nav-book-session-btn"
            onClick={() => onNavigate('booking')}
            className="px-6 py-3 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <span>Book a Session</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            id="nav-book-session-btn-mobile"
            onClick={() => onNavigate('booking')}
            className="px-3.5 py-1.5 bg-[#1C1C1A] text-[#F4F1EC] text-xs uppercase tracking-[0.08em] font-medium rounded-[4px]"
          >
            Book
          </button>
          <button
            id="mobile-nav-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#1C1C1A] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Full-Screen Overlay Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="fixed inset-0 top-[70px] z-40 bg-[#F4F1EC] px-8 py-10 flex flex-col justify-between overflow-y-auto animate-fadeIn"
        >
          <div className="space-y-6">
            <div className="border-b border-[#D8D2C8] pb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-[#66645F]">Navigation</span>
            </div>
            <nav className="flex flex-col space-y-5">
              {navCenterItems.map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id, item.target)}
                  className="text-left text-2xl font-heading tracking-wide text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <button
                id="mobile-nav-contact"
                onClick={() => {
                  onNavigate('contact');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-2xl font-heading tracking-wide text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors"
              >
                Contact
              </button>
            </nav>
          </div>

          <div className="pt-8 border-t border-[#D8D2C8] space-y-5">
            <button
              id="mobile-nav-book-large"
              onClick={() => {
                onNavigate('booking');
                setMobileMenuOpen(false);
              }}
              className="w-full py-4 bg-[#1C1C1A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] text-center"
            >
              Book a Session
            </button>
            <div className="text-xs text-[#66645F] space-y-1">
              <p>Chennai, Tamil Nadu</p>
              <p>Inquiries: <a href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`} className="text-[#1C1C1A] font-semibold">{siteSettings.phone}</a></p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

