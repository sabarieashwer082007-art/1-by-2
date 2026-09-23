# 1 BY 2 STUDIO — MEDIA & IMAGE ASSET MANAGEMENT GUIDE

This operational guide provides step-by-step instructions for studio managers and editors at **1 by 2 Studio** to upload, replace, curate, and archive photographic assets.

---

## 1. Supported Image Formats & Specifications

To ensure optimal visual fidelity on Retina displays and fast load times across Chennai and global clients:

| Aspect Ratio | Recommended Resolution | Best Use Case |
| :--- | :--- | :--- |
| **3:4 (Portrait)** | `1200 × 1600 px` | Bridal Couture, Heritage Saree Portraits, Editorial Covers |
| **16:9 (Landscape)** | `1920 × 1080 px` | Studio Hero Headers, Reception Storyboards, Film Stills |
| **1:1 (Square)** | `1200 × 1200 px` | Grid Highlights, Client Reviews, Social Highlights |
| **4:5 (Standard)** | `1200 × 1500 px` | Portfolio Masonry Grid, Instagram Showcase |

- **Color Profile:** sRGB (embedded)
- **Format:** High-grade WebP or optimized JPEG
- **Compression:** 80–85% quality recommended

---

## 2. Adding Images to the Media Library

1. Navigate to the **Admin Portal** &rarr; **Media Library**.
2. Click **Upload Image Asset** in the top-right corner.
3. Fill in the modal fields:
   - **Image Title**: Human-readable label (e.g., *Mylapore Golden Hour Saree*).
   - **High-Resolution Image URL**: Direct HTTPS link to the hosted image asset.
   - **Section**: Select appropriate placement category (`Portfolio`, `Hero Visuals`, `Services`, `Atelier & About`, `Testimonials`).
   - **Target Slot (Optional)**: If targeting a specific template placeholder (e.g., `homepage-hero`).
4. Click **Save to Media Library**.

---

## 3. Replacing Existing Site Images In-Place

To replace a hero visual or portfolio photograph without breaking layout links:
1. Locate the image card in the **Media Library** or **Portfolio** grid.
2. Click the **Replace** button on the card.
3. Enter the new high-resolution image URL.
4. Preview the image replacement in the live thumbnail preview.
5. Click **Confirm Image Replacement**.
6. The backend endpoint (`POST /api/admin/media/replace`) automatically updates the asset and propagates changes across all linked pages.

---

## 4. Deleting Imagery Assets Safely

All image deletions are handled through authenticated server routes to prevent client-side `permission-denied` errors:
1. Click the **Trash / Delete** icon on the respective image card.
2. Confirm the prompt dialog.
3. The server validates your administrative session, logs the deletion, and safely removes the asset reference from Firestore.
