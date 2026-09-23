import React, { useState } from 'react';
import { MessageCircle, X, ArrowUpRight, Check, Phone } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface WhatsAppButtonProps {
  currentPage?: string;
  currentService?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  currentPage = 'home',
  currentService,
}) => {
  const { siteSettings } = useStudio();
  const [isOpen, setIsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Normalize phone number to international format for WhatsApp: 918015483954
  const rawNumber = siteSettings.whatsappNumber || siteSettings.phone || '80154 83954';
  const cleanDigits = rawNumber.replace(/\D/g, '');
  const phone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits || '918015483954';
  const formattedDisplay = '80154 83954';

  // Context-aware message pre-fill based on the current page or service
  const getContextMessage = (): string => {
    if (currentService) {
      return `Hello 1 by 2 Studio, I am interested in inquiring about your "${currentService}" photography session. Could you share availability and details?`;
    }

    switch (currentPage) {
      case 'services':
        return `Hello 1 by 2 Studio, I was viewing your photography disciplines & offerings and would like to inquire about scheduling a session.`;
      case 'portfolio':
        return `Hello 1 by 2 Studio, I was browsing your curated photography portfolio and would love to discuss an upcoming commission.`;
      case 'about':
        return `Hello 1 by 2 Studio, I read your studio story and would love to consult with your atelier director.`;
      case 'booking':
        return `Hello 1 by 2 Studio, I'm looking to reserve a photography date in Chennai. Are you available?`;
      case 'reviews':
        return `Hello 1 by 2 Studio, I was reading your client reflections and would like to learn more about booking an event.`;
      case 'contact':
        return `Hello 1 by 2 Studio, I'd like to schedule a direct consultation at your Chennai atelier.`;
      case 'home':
      default:
        return `Hello 1 by 2 Studio, I would like to inquire about your photography commissions and session availability.`;
    }
  };

  const message = getContextMessage();
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const handleOpenChat = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`+91 ${formattedDisplay}`);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      id="global-whatsapp-widget"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-45 font-sans"
    >
      {/* Expanded Quick Dialogue Popover */}
      {isOpen && (
        <div
          id="whatsapp-chat-popover"
          className="absolute bottom-16 right-0 w-80 sm:w-88 rounded-[8px] bg-[#FFFFFF] border border-[#D8D2C8] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {/* Atelier Brand Header */}
          <div className="p-4 bg-[#1C1C1A] text-[#F4F1EC] flex items-center justify-between border-b border-[#2E2E2B]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h4 className="font-heading text-sm font-semibold tracking-wide text-[#F4F1EC]">
                  1 by 2 Studio · Atelier
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span className="text-[11px] text-[#D8D2C8] font-sans">
                    Direct Line · Chennai
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#D8D2C8] hover:text-[#F4F1EC] p-1 rounded transition-colors cursor-pointer"
              aria-label="Close WhatsApp dialogue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body with Pre-filled Context Note */}
          <div className="p-4 space-y-3.5 bg-[#F4F1EC]/60">
            <div className="p-3 bg-[#FFFFFF] rounded-[6px] border border-[#D8D2C8] shadow-xs space-y-1.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#6B4F3A] block">
                Pre-composed message for your inquiry:
              </span>
              <p className="text-xs text-[#1C1C1A] italic leading-relaxed">
                "{message}"
              </p>
            </div>

            <div className="text-[11px] text-[#66645F] flex items-center justify-between px-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#6B4F3A]" />
                +91 {formattedDisplay}
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="text-[10px] text-[#6B4F3A] hover:underline font-semibold cursor-pointer"
              >
                {hasCopied ? 'Copied to clipboard' : 'Copy Number'}
              </button>
            </div>

            {/* Direct Open Button */}
            <button
              type="button"
              id="whatsapp-dialog-launch-btn"
              onClick={handleOpenChat}
              className="w-full py-2.5 px-4 rounded-[4px] bg-[#25D366] hover:bg-[#20bd5a] text-[#FFFFFF] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Continue to WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="relative group">
        <button
          type="button"
          id="global-whatsapp-trigger"
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 sm:h-13 sm:w-13 rounded-full bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] border border-[#D8D2C8]/70 shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6B4F3A]/50 relative"
          aria-label="Chat with 1 by 2 Studio on WhatsApp"
        >
          {/* Green notification indicator ring */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-[#FFFFFF] flex items-center justify-center shadow-xs" />

          <MessageCircle className="w-6 h-6 text-[#F4F1EC] transition-transform group-hover:rotate-6" />
        </button>

        {/* Discreet Hover Tooltip (when popover is closed) */}
        {!isOpen && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-[#1C1C1A] text-[#F4F1EC] text-[11px] font-sans px-3 py-1.5 rounded-[4px] shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-[#2E2E2B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
              <span>WhatsApp Atelier: <strong className="font-mono font-medium">{formattedDisplay}</strong></span>
            </div>
            <div className="w-1.5 h-1.5 bg-[#1C1C1A] rotate-45 -ml-1" />
          </div>
        )}
      </div>
    </div>
  );
};
