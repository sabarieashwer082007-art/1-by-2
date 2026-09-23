export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id?: string;
  bookingId: string;
  secureToken: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  adminId?: string;
  emailStatus?: 'sent' | 'failed' | 'not_configured' | 'pending';
  whatsappStatus?: 'sent' | 'failed' | 'not_configured' | 'pending';
  approval_email_sent?: boolean;
  approval_email_sent_at?: string;
  lastEmailError?: string;
  lastWhatsappError?: string;
  galleryToken?: string;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  featured: boolean;
  visible: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioCategory {
  id?: string;
  name: string;
  slug: string;
  order: number;
}

export interface ServiceItem {
  id?: string;
  name: string;
  title?: string;
  tagline?: string;
  slug?: string;
  description: string;
  imageUrl?: string;
  icon?: string;
  ctaText?: string;
  startingPrice?: string;
  duration?: string;
  features?: string[];
  order: number;
  active: boolean;
}

export interface ReviewItem {
  id?: string;
  name?: string;
  customerName: string;
  reviewText: string;
  rating: number;
  customerImage?: string;
  service?: string;
  approved: boolean;
  order: number;
  createdAt?: string;
}

export interface NotificationItem {
  id?: string;
  type: 'new_booking' | 'status_change' | 'system';
  bookingId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface EmailLog {
  id?: string;
  recipient: string;
  bookingId?: string;
  type: 'new_booking' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'manual_resend' | 'test';
  subject: string;
  status: 'sent' | 'failed' | 'not_configured';
  providerMessageId?: string;
  createdAt: string;
  sentAt?: string;
  error?: string;
  retryCount: number;
}

export interface WhatsappLog {
  id?: string;
  phone: string;
  bookingId?: string;
  type: 'booking_approved' | 'booking_rejected' | 'test';
  status: 'sent' | 'failed' | 'not_configured';
  providerMessageId?: string;
  createdAt: string;
  sentAt?: string;
  error?: string;
  retryCount: number;
}

export interface AuditLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  bookingId?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export type AvailabilityStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Availability {
  id?: string;
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  reason?: string;
  bookingId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  category?: string;
  favorite?: boolean;
  visible: boolean;
  order: number;
  uploadedAt?: string;
  createdAt?: string;
}

export interface Gallery {
  id?: string;
  galleryId: string;
  bookingId: string;
  secureToken: string;
  clientName: string;
  clientEmail: string;
  service: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
  revokedAt?: string;
  photos: GalleryPhoto[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  loading?: boolean;
}

export interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  headingColor: string;
  bodyTextColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  borderColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  updatedAt?: string;
}

export interface SiteSettings {
  studioName: string;
  phone: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  businessHours: string;
  instagram: string;
  facebook: string;
  youtube: string;
  whatsappNumber: string;
  updatedAt?: string;
}

export interface WebsiteContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    bgImage: string;
    tagline: string;
  };
  about: {
    story: string;
    mission: string;
    philosophy: string;
    experienceYears: string;
    shootsCompleted: string;
    happyClients: string;
    image: string;
  };
  servicesHeader: {
    title: string;
    subtitle: string;
  };
  portfolioHeader: {
    title: string;
    subtitle: string;
  };
  reviewsHeader: {
    title: string;
    subtitle: string;
  };
  contactSection: {
    title: string;
    subtitle: string;
  };
}

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  parentId?: string;
  subcategories?: string[];
  order: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  dimensions?: string;
  filePath?: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  description?: string;
  page?: 'home' | 'about' | 'services' | 'portfolio' | 'reviews' | 'contact' | 'booking' | 'general' | string;
  section?: 'hero' | 'featured_story' | 'approach' | 'services' | 'portfolio' | 'about' | 'about_atelier' | 'testimonials' | 'cta' | 'general' | string;
  slot?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  clientSection?: string;
  adminSection?: string;
  visible: boolean;
  status?: 'active' | 'inactive';
  activeOnSite?: boolean;
  source?: 'local' | 'online' | 'seed';
  order?: number;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  usageLabel?: string;
  usedIn?: string[];
}
