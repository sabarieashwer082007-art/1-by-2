import { Router, Response } from 'express';
import { requireAdmin, AuthenticatedRequest, getAdminEmails } from '../middleware/authMiddleware.ts';
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  reorderPortfolioItems,
  getMediaAssets,
  addMediaAsset,
  deleteMediaAsset,
} from '../services/portfolioService.ts';
import { sendEmail } from '../services/emailService.ts';
import { sendWhatsappMessage } from '../services/whatsappService.ts';

const router = Router();

// Public status check (non-sensitive)
router.get('/integration-status', (req, res) => {
  res.json({
    firebase: {
      status: 'CONNECTED',
      projectId: 'oceanic-carrier-1dtd0',
      databaseId: 'ai-studio-d5e33cf4-7a01-41f5-9f52-e320b4e460a0',
    },
    adminEmail: process.env.ADMIN_EMAIL || 'nilora23x@gmail.com',
    allowedAdmins: getAdminEmails(),
    email: {
      status: process.env.EMAIL_API_KEY || process.env.SMTP_HOST ? 'CONNECTED' : 'NOT CONFIGURED',
      provider: process.env.EMAIL_PROVIDER || 'resend',
      from: process.env.EMAIL_FROM || '1 by 2 Studio <bookings@1by2studio.com>',
      adminEmail: process.env.ADMIN_EMAIL || 'nilora23x@gmail.com',
    },
    whatsapp: {
      status: process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID ? 'CONNECTED' : 'NOT CONFIGURED',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? '***configured***' : null,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    },
  });
});

// Admin Token Verification & WhoAmI
router.get('/auth-check', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    authenticated: true,
    user: req.adminUser,
    message: 'Authorized as Studio Administrator.',
    serverTimestamp: new Date().toISOString(),
  });
});

// ----------------- PORTFOLIO CRUD -----------------
// GET all portfolio items
router.get('/portfolio', async (req, res) => {
  try {
    const items = await getPortfolioItems();
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create portfolio item (Protected)
router.post('/portfolio', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, imageUrl, description, featured, visible, order, tags, aspectRatio } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ error: 'Title and image URL are required.' });
    }

    const newItem = await createPortfolioItem({
      title: title.trim(),
      category: category || 'Wedding',
      imageUrl: imageUrl.trim(),
      description: description ? description.trim() : '',
      featured: Boolean(featured),
      visible: visible !== false,
      order: Number(order) || 1,
      tags: Array.isArray(tags) ? tags : [],
      aspectRatio: aspectRatio || '3:4',
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update portfolio item (Protected)
router.put('/portfolio/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await updatePortfolioItem(id, updates);
    res.json({ success: true, item: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE portfolio item (Protected) — ROOT CAUSE FIX FOR DELETE BUTTON
router.delete('/portfolio/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing portfolio item ID.' });
    }

    console.log(`[adminRoutes] Deleting portfolio item ${id} requested by ${req.adminUser?.email}`);
    const result = await deletePortfolioItem(id);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to delete portfolio item.' });
    }

    res.json({
      success: true,
      deletedId: id,
      message: `Portfolio item ${id} deleted successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST reorder portfolio items (Protected)
router.post('/portfolio/reorder', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders array required.' });
    }

    const success = await reorderPortfolioItems(orders);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- MEDIA LIBRARY -----------------
// GET all media assets
router.get('/media', async (req, res) => {
  try {
    const assets = await getMediaAssets();
    res.json({ assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add media asset (Protected)
router.post('/media', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, url, section, category, size } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required.' });
    }

    const asset = await addMediaAsset({
      title: title.trim(),
      url: url.trim(),
      section: section || 'portfolio',
      category: category || 'General',
      size: size || 'HD',
    });

    res.status(201).json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE media asset (Protected)
router.delete('/media/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteMediaAsset(id);
    res.json({ success, deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- INTEGRATION TESTS (Protected) -----------------
router.post('/test-email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { recipient } = req.body;
  const target = recipient || process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
  const result = await sendEmail({
    to: target,
    subject: 'Test Integration — 1 by 2 Studio',
    html: `<h3>Test Email Delivery</h3><p>Triggered by authenticated admin ${req.adminUser?.email}.</p>`,
    type: 'test',
  });
  res.json(result);
});

router.post('/test-whatsapp', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { phone } = req.body;
  const target = phone || '80154 83954';
  const result = await sendWhatsappMessage({
    phone: target,
    clientName: 'Studio Tester',
    bookingId: 'TEST-1B2-001',
    service: 'System Verification',
    date: new Date().toISOString().split('T')[0],
    time: '12:00 PM',
    type: 'test',
  });
  res.json(result);
});

// ----------------- EXPORT BOOKINGS (Protected) -----------------
router.post('/bookings/export', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookings = [] } = req.body;
    const headers = [
      'Booking ID',
      'Client Name',
      'Email',
      'Phone',
      'Service',
      'Preferred Date',
      'Preferred Time',
      'Status',
      'Created Date',
      'Approved Date',
      'Completed Date',
      'Admin Notes',
    ];

    const escapeCsvCell = (str: any) => {
      if (str === null || str === undefined) return '""';
      const value = String(str).replace(/"/g, '""');
      return `"${value}"`;
    };

    const csvRows = [headers.join(',')];
    bookings.forEach((b: any) => {
      const row = [
        escapeCsvCell(b.bookingId || ''),
        escapeCsvCell(b.clientName || ''),
        escapeCsvCell(b.clientEmail || ''),
        escapeCsvCell(b.clientPhone || ''),
        escapeCsvCell(b.service || ''),
        escapeCsvCell(b.preferredDate || ''),
        escapeCsvCell(b.preferredTime || ''),
        escapeCsvCell(b.status || ''),
        escapeCsvCell(b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''),
        escapeCsvCell(b.approvedAt ? new Date(b.approvedAt).toLocaleDateString() : ''),
        escapeCsvCell(b.completedAt ? new Date(b.completedAt).toLocaleDateString() : ''),
        escapeCsvCell(b.adminNotes || ''),
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="1by2_studio_bookings_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
