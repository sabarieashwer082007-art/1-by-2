# 1 BY 2 STUDIO — FIREBASE CONFIGURATION & PROVISIONING MANUAL

This document outlines the production architecture, Firebase initialization, and administrator credential management for **1 by 2 Studio**, Chennai, Tamil Nadu.

---

## 1. Project Specifications

| Attribute | Configuration Value |
| :--- | :--- |
| **Studio Name** | 1 by 2 Studio |
| **Location** | Chennai, Tamil Nadu, India |
| **Firebase Project ID** | `oceanic-carrier-1dtd0` |
| **Database Engine** | Cloud Firestore |
| **Authentication Providers** | Google Identity Services (GIS) & Firebase Auth |
| **Primary Administrator** | `brucetamilyt@gmail.com` |
| **Secondary Administrator** | `nilora23x@gmail.com` |

---

## 2. Firestore Collections & Schema Architecture

All core application collections and documents are managed with strict schema validation:

### `bookings` (Client Reservation Requests)
- `bookingId`: Unique reference code (e.g., `BKG-2026-XXXX`)
- `clientName`: Full name of patron
- `clientEmail`: Client email for confirmation notices
- `clientPhone`: WhatsApp/phone contact number
- `service`: Photography discipline (e.g., Bridal & Wedding, Fine-Art Editorial)
- `preferredDate`: Requested shoot date (`YYYY-MM-DD`)
- `preferredTime`: Requested time slot
- `status`: Booking state (`pending` \| `approved` \| `completed` \| `cancelled`)
- `createdAt` / `updatedAt`: ISO 8601 timestamps

### `portfolio` (Curated Visual Commissions)
- `id`: Unique document ID
- `title`: Commission title
- `category`: Category identifier (`editorial`, `wedding`, `fashion`, `portrait`, `films`)
- `imageUrl`: High-resolution asset URL
- `thumbnailUrl`: Optimized grid image URL
- `featured`: Boolean flag for homepage hero showcase
- `order`: Display sort order

### `mediaLibrary` (Global Website Imagery Assets)
- `id`: Asset key
- `title`: Asset descriptive name
- `url`: Direct CDN/storage URL
- `section`: Target site area (`hero`, `portfolio`, `services`, `about`, `testimonials`)
- `slot`: Dedicated slot identifier (e.g., `homepage-hero`)
- `visible`: Display visibility boolean

### `services` (Studio Disciplines & Rates)
- `id`: Unique slug/ID
- `title`: Service title
- `tagline`: Category sub-heading
- `startingPrice`: Base investment (e.g., `₹45,000`)
- `duration`: Typical commission duration
- `features`: Array of deliverables
- `active`: Visibility flag

### `reviews` (Patron Accolades)
- `id`: Review identifier
- `name`: Client names
- `service`: Commission type
- `rating`: 1–5 star rating
- `reviewText`: Testimonial quote
- `approved`: Moderation approval flag

### `designSettings/theme` (Visual Identity & CSS Tokens)
- `primaryColor`, `secondaryColor`, `accentColor`, `backgroundColor`, `surfaceColor`, `headingColor`, `bodyTextColor`, `buttonColor`, `borderColor`, `headingFont`, `bodyFont`, `borderRadius`

---

## 3. Security Rules & Access Control

Direct client-side deletions and unauthorized administrative mutations are blocked at the Firestore security rule level (`firestore.rules`). 

All administrative writes (such as deleting portfolio items, modifying media slots, or altering studio closures) are executed via **authenticated server routes** (`/api/admin/*`) requiring a valid Firebase Bearer ID token verified against the authorized admin allowlist (`brucetamilyt@gmail.com` and `nilora23x@gmail.com`).

To deploy Firestore security rules to production:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Admin Access & Role Verification

1. Access the studio portal at `/admin` (or click **Portal** in the website footer).
2. Authenticate with an authorized administrator account (`brucetamilyt@gmail.com` or `nilora23x@gmail.com`).
3. The server-side authentication layer will grant access to the Operations Dashboard, Bookings Table, Media Library, Services, and Visual Identity Engine.
