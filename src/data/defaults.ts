import { DesignSettings, SiteSettings, WebsiteContent, PortfolioCategory, ServiceItem, ReviewItem } from '../types';

export const DEFAULT_DESIGN: DesignSettings = {
  primaryColor: '#202522', // Deep Forest Charcoal
  secondaryColor: '#E8E3DB', // Soft Stone
  accentColor: '#6B4F3A', // Walnut Brown
  backgroundColor: '#F4F1EC', // Warm Ivory
  surfaceColor: '#E8E3DB', // Soft Stone
  headingColor: '#1C1C1A', // Deep Charcoal
  bodyTextColor: '#66645F', // Muted Graphite
  buttonColor: '#1C1C1A', // Deep Charcoal
  buttonHoverColor: '#6B4F3A', // Walnut Brown
  borderColor: '#D8D2C8',
  headingFont: 'Cormorant Garamond',
  bodyFont: 'Manrope',
  borderRadius: '6px',
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  studioName: '1 by 2 Studio',
  phone: '80154 83954',
  email: 'contact@1by2studio.com',
  address: 'No. 24, Art Lane, Creative Quarter, Chennai, Tamil Nadu - 600004',
  googleMapsUrl: 'https://maps.google.com/?q=1+by+2+Studio+Chennai',
  businessHours: 'Mon - Sat: 9:00 AM – 8:00 PM | Sunday: By Appointment',
  instagram: 'https://instagram.com/1by2studio',
  facebook: 'https://facebook.com/1by2studio',
  youtube: 'https://youtube.com/@1by2studio',
  whatsappNumber: '+918015483954',
};

export const DEFAULT_CONTENT: WebsiteContent = {
  hero: {
    title: 'Frames that breathe, moments that endure.',
    subtitle: '1 by 2 Studio creates bespoke visual narratives — wedding, fashion, portrait, and editorial imagery crafted with cinematic precision.',
    ctaText: 'Book a Session',
    bgImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=2000&q=85',
    tagline: 'CINEMATIC & FINE ART PHOTOGRAPHY',
  },
  about: {
    story: 'Founded with an obsessive dedication to light, composition, and authentic emotion, 1 by 2 Studio blends contemporary editorial style with timeless romanticism. We do not simply take pictures; we archive your most sacred milestones.',
    mission: 'To create heirloom imagery that preserves genuine human connection and grandeur for generations to come.',
    philosophy: 'Minimal intrusion, maximal intimacy. We harness natural light and high-end studio illumination to capture the spontaneous poetry of real moments.',
    experienceYears: '12+',
    shootsCompleted: '1,450+',
    happyClients: '980+',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85',
  },
  servicesHeader: {
    title: 'Our Signature Services',
    subtitle: 'Curated photography experiences designed around your vision, milestones, and personal aesthetic.',
  },
  portfolioHeader: {
    title: 'Featured Works & Gallery',
    subtitle: 'Explore our selected commissions spanning weddings, intimate portraits, editorial fashion, and corporate campaigns.',
  },
  reviewsHeader: {
    title: 'Words From Our Patrons',
    subtitle: 'Reflections from couples, families, and creative directors who trusted 1 by 2 Studio.',
  },
  contactSection: {
    title: 'Reserve Your Session',
    subtitle: 'Dates fill up quickly across peak wedding and event seasons. Submit an inquiry and our studio director will reach out within 24 hours.',
  },
};

export const DEFAULT_CATEGORIES: PortfolioCategory[] = [
  { id: 'cat_all', name: 'All', slug: 'all', order: 0 },
  { id: 'cat_weddings', name: 'Weddings', slug: 'weddings', order: 1 },
  { id: 'cat_couples', name: 'Couples', slug: 'couples', order: 2 },
  { id: 'cat_portraits', name: 'Portraits', slug: 'portraits', order: 3 },
  { id: 'cat_fashion', name: 'Fashion', slug: 'fashion', order: 4 },
  { id: 'cat_events', name: 'Events', slug: 'events', order: 5 },
];

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv_wedding',
    name: 'Wedding Photography',
    description: 'Cinematic candid moments, royal mandap ceremonies, and emotional nuptial stories documented with timeless editorial elegance.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    icon: 'Heart',
    ctaText: 'Inquire Wedding Date',
    order: 1,
    active: true,
  },
  {
    id: 'srv_prewedding',
    name: 'Pre-Wedding Stories',
    description: 'Poetic couple narratives captured along scenic coasts, heritage architecture, and intimate spaces with personalized moodboards.',
    imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
    icon: 'Sparkles',
    ctaText: 'Plan Concept Shoot',
    order: 2,
    active: true,
  },
  {
    id: 'srv_couples',
    name: 'Couple Portraits',
    description: 'Artistic, unposed portraits exploring natural connection, subtle gestures, and nuanced atmospheric lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
    icon: 'Camera',
    ctaText: 'Reserve Session',
    order: 3,
    active: true,
  },
  {
    id: 'srv_fashion',
    name: 'Fashion & Editorial',
    description: 'High-fashion lookbooks, designer campaigns, and magazine spreads conceived with contemporary artistic direction and master grading.',
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=85',
    icon: 'Aperture',
    ctaText: 'Commission Campaign',
    order: 4,
    active: true,
  },
  {
    id: 'srv_events',
    name: 'Events',
    description: 'Cultural celebrations, high-profile galas, and milestone gatherings captured with natural ambient sensitivity.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85',
    icon: 'Calendar',
    ctaText: 'Check Availability',
    order: 5,
    active: true,
  },
  {
    id: 'srv_commercial',
    name: 'Commercial Photography',
    description: 'Brand narratives, luxury interior aesthetics, and product storytelling that elevate visual identity.',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85',
    icon: 'Aperture',
    ctaText: 'Discuss Project',
    order: 6,
    active: true,
  },
];

export const INITIAL_PORTFOLIO = [
  {
    id: 'port_wedding_mandap',
    title: 'The Royal Mandap Nuptials',
    description: 'Intimate evening wedding vows captured in warm amber hues and gold embroidery.',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    category: 'Weddings',
    featured: true,
    visible: true,
    order: 1,
  },
  {
    id: 'port_coastal_romance',
    title: 'Coastal Romance at Dusk',
    description: 'Pre-wedding session along the misty shores with dramatic natural lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    category: 'Couples',
    featured: true,
    visible: true,
    order: 2,
  },
  {
    id: 'port_golden_hour_silhouette',
    title: 'Golden Hour Silhouette',
    description: 'Monochrome and high-contrast studio portrait exploring subtle emotive expressions.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
    category: 'Portraits',
    featured: true,
    visible: true,
    order: 3,
  },
  {
    id: 'port_haute_couture',
    title: 'Haute Couture Silk Walk',
    description: 'Editorial fashion campaign featuring handloom bridal silk ensembles.',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    category: 'Fashion',
    featured: true,
    visible: true,
    order: 4,
  },
  {
    id: 'port_midnight_gala',
    title: 'Midnight Lantern Gala',
    description: 'High-energy cultural event photography with natural mood lights.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    category: 'Events',
    featured: false,
    visible: true,
    order: 5,
  },
  {
    id: 'port_temple_bells',
    title: 'Temple Bells & Whispers',
    description: 'Bespoke couple documentary captured in the courtyards of ancient Thanjavur.',
    imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80',
    category: 'Couples',
    featured: true,
    visible: true,
    order: 6,
  },
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_priya_siddharth',
    customerName: 'Priya & Siddharth Raman',
    reviewText: '1 by 2 Studio captured our wedding with such tenderness and cinematic elegance. Looking back at our album feels like reliving a film. Their team was invisible yet captured every tear and smile.',
    rating: 5,
    customerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    service: 'Wedding Photography',
    approved: true,
    order: 1,
  },
  {
    id: 'rev_vikram',
    customerName: 'Vikram Chandrasekar',
    reviewText: 'Booked executive headshots and brand portraits. The lighting mastery, prompt turnaround, and studio ambience exceeded expectations. Truly first-rate craftsmanship.',
    rating: 5,
    customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    service: 'Portrait Photography',
    approved: true,
    order: 2,
  },
  {
    id: 'rev_ananya_dinesh',
    customerName: 'Ananya & Dinesh Nair',
    reviewText: 'Our pre-wedding shoot was effortlessly enjoyable. The photographers guided our poses naturally and made us feel so comfortable. The phone customer support and booking confirmations were flawless!',
    rating: 5,
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    service: 'Pre-Wedding Session',
    approved: true,
    order: 3,
  },
];
