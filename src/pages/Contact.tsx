import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export const Contact: React.FC = () => {
  const { siteSettings } = useStudio();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div id="contact-page-container" className="bg-[#F4F1EC] text-[#1C1C1A] min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
        
        {/* Editorial Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[#6B4F3A]" />
            <span className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A]">
              INQUIRIES &amp; ATELIER
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[64px] font-light leading-[1.08] tracking-tight text-[#1C1C1A]">
            Let’s discuss your vision.
          </h1>

          <p className="text-[16px] lg:text-[17px] text-[#66645F] font-sans leading-relaxed">
            Reach out directly to schedule an intimate studio consultation, review date availability, or request tailored commission proposals.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Info Card (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 sm:p-10 rounded-[6px] border border-[#D8D2C8] bg-[#E8E3DB]/50 space-y-8">
              <div className="space-y-1 border-b border-[#D8D2C8] pb-4">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold block">
                  ATELIER DETAILS
                </span>
                <h2 className="font-heading text-2xl font-semibold text-[#1C1C1A]">
                  Chennai Studio Office
                </h2>
              </div>

              <div className="space-y-6 text-sm text-[#66645F] font-sans">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[4px] bg-[#F4F1EC] border border-[#D8D2C8] flex items-center justify-center text-[#6B4F3A] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#1C1C1A] font-semibold block">
                      Direct Telephone &amp; WhatsApp
                    </span>
                    <a
                      href={`tel:${siteSettings.phone.replace(/\s+/g, '')}`}
                      className="text-base font-semibold text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors mt-0.5 block"
                    >
                      {siteSettings.phone}
                    </a>
                    <span className="text-xs text-[#66645F] mt-1 block">Mon–Sun from 9:00 AM to 8:00 PM</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[4px] bg-[#F4F1EC] border border-[#D8D2C8] flex items-center justify-center text-[#6B4F3A] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#1C1C1A] font-semibold block">
                      Electronic Mail
                    </span>
                    <a
                      href={`mailto:${siteSettings.email}`}
                      className="text-base font-semibold text-[#1C1C1A] hover:text-[#6B4F3A] transition-colors mt-0.5 block"
                    >
                      {siteSettings.email}
                    </a>
                    <span className="text-xs text-[#66645F] mt-1 block">Replies provided within 24 business hours</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[4px] bg-[#F4F1EC] border border-[#D8D2C8] flex items-center justify-center text-[#6B4F3A] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#1C1C1A] font-semibold block">
                      Studio Location
                    </span>
                    <p className="text-sm text-[#1C1C1A] mt-0.5 leading-relaxed">
                      {siteSettings.address}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[4px] bg-[#F4F1EC] border border-[#D8D2C8] flex items-center justify-center text-[#6B4F3A] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#1C1C1A] font-semibold block">
                      Consultation Hours
                    </span>
                    <p className="text-sm text-[#1C1C1A] mt-0.5">
                      {siteSettings.businessHours || 'By appointment only (Tuesday–Sunday)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-[6px] border border-[#D8D2C8] bg-[#F4F1EC]">
              <div className="mb-8 space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-[#6B4F3A] font-semibold block">
                  INQUIRY SUBMISSION
                </span>
                <h2 className="font-heading text-3xl font-light text-[#1C1C1A]">
                  Start a Conversation
                </h2>
              </div>

              {submitted ? (
                <div className="p-8 rounded-[6px] bg-[#E8E3DB] border border-[#6B4F3A]/40 text-[#1C1C1A] space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-lg text-[#6B4F3A]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Inquiry Received</span>
                  </div>
                  <p className="text-sm text-[#66645F] leading-relaxed">
                    Thank you for contacting 1 by 2 Studio. Our studio director will review your details and be in touch within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F] font-sans">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ananya Raman"
                        className="w-full px-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F] font-sans">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. ananya@example.com"
                        className="w-full px-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F] font-sans">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98400 12345"
                        className="w-full px-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F] font-sans">
                        Discipline / Event Type
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Wedding / Couple / Editorial"
                        className="w-full px-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold mb-2 text-[#66645F] font-sans">
                      Your Story &amp; Details *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about the dates, venue in Chennai or destination, and your aesthetic vision..."
                      className="w-full px-4 py-3 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] placeholder-[#66645F]/50 focus:outline-none focus:border-[#6B4F3A] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1C1C1A] hover:bg-[#6B4F3A] text-[#F4F1EC] text-[13px] font-sans font-medium uppercase tracking-[0.08em] rounded-[4px] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <span>Send Studio Inquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
