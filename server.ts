import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { sendEmail } from './server/src/services/emailService.js';
import { sendWhatsappMessage } from './server/src/services/whatsappService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory / persisted tracking bridge for API requests
// Firebase client SDK is used in frontend and server-side operations
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const STUDIO_PHONE = '80154 83954';
const STUDIO_NAME = '1 by 2 Studio';

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    studio: STUDIO_NAME,
    phone: STUDIO_PHONE,
    time: new Date().toISOString(),
    emailConfigured: Boolean(process.env.EMAIL_API_KEY || process.env.SMTP_HOST),
    whatsappConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  });
});

// Settings status endpoint for Admin Settings
app.get('/api/admin/integration-status', (req, res) => {
  res.json({
    firebase: {
      status: 'CONNECTED',
      projectId: 'oceanic-carrier-1dtd0',
      databaseId: 'ai-studio-d5e33cf4-7a01-41f5-9f52-e320b4e460a0',
    },
    email: {
      status: (process.env.EMAIL_API_KEY || process.env.SMTP_HOST) ? 'CONNECTED' : 'NOT CONFIGURED',
      provider: process.env.EMAIL_PROVIDER || 'resend',
      from: process.env.EMAIL_FROM || '1 by 2 Studio <bookings@1by2studio.com>',
      adminEmail: process.env.ADMIN_EMAIL || 'nilora23x@gmail.com',
    },
    whatsapp: {
      status: (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) ? 'CONNECTED' : 'NOT CONFIGURED',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? '***configured***' : null,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    },
  });
});

// Trigger real admin notification email when new booking is created
app.post('/api/notifications/new-booking-email', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking) {
      return res.status(400).json({ error: 'Missing booking payload' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
    const viewUrl = `${APP_URL}/admin/bookings/${booking.bookingId}`;

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #c59b27; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px;">1 BY 2 STUDIO</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px; letter-spacing: 1px;">PREMIUM PHOTOGRAPHY STUDIO</p>
        </div>
        <div style="background-color: #1e293b; padding: 24px; border-radius: 6px; border: 1px solid #334155;">
          <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">New Booking Received</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            A new photography booking has been received through the studio website.
          </p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;" />
          <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #94a3b8; width: 140px;">Booking ID:</td><td style="font-weight: bold; color: #c59b27;">${booking.bookingId}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Client Name:</td><td>${booking.clientName}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Email:</td><td>${booking.clientEmail}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Phone:</td><td>${booking.clientPhone}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Service:</td><td>${booking.service}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Preferred Date:</td><td>${booking.preferredDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Preferred Time:</td><td>${booking.preferredTime || 'Flexible'}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Message:</td><td>${booking.message || 'None provided'}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Status:</td><td><span style="background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Pending</span></td></tr>
          </table>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${viewUrl}" style="background-color: #c59b27; color: #0f172a; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block; font-size: 14px; letter-spacing: 0.5px;">VIEW BOOKING</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
          <p>1 by 2 Studio • Phone: 80154 83954</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject: `New Booking Received — 1 by 2 Studio (${booking.bookingId})`,
      html: emailHtml,
      bookingId: booking.bookingId,
      type: 'new_booking',
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, status: 'failed', error: err.message });
  }
});

// Trigger customer acceptance email + WhatsApp on approval
app.post('/api/bookings/dispatch-approval', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking) {
      return res.status(400).json({ error: 'Missing booking payload' });
    }

    const secureBookingUrl = `${APP_URL}/booking/${booking.secureToken || booking.bookingId}`;

    // 1. Send customer email
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #c59b27; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px;">1 BY 2 STUDIO</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px; letter-spacing: 1px;">PREMIUM PHOTOGRAPHY STUDIO</p>
        </div>
        <div style="background-color: #1e293b; padding: 24px; border-radius: 6px; border: 1px solid #334155;">
          <h2 style="color: #22c55e; font-size: 18px; margin-top: 0;">Your Photography Booking Has Been Approved</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Hello <strong>${booking.clientName}</strong>,<br/>
            Your photography booking with <strong>1 by 2 Studio</strong> has been approved. We are honored to capture your milestone.
          </p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;" />
          <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #94a3b8; width: 140px;">Booking ID:</td><td style="font-weight: bold; color: #c59b27;">${booking.bookingId}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Service:</td><td>${booking.service}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Date:</td><td>${booking.preferredDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Time:</td><td>${booking.preferredTime || 'Confirmed'}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Booking Status:</td><td><span style="background: #22c55e; color: #0f172a; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">APPROVED</span></td></tr>
          </table>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
            Thank you for choosing 1 by 2 Studio.<br/>
            Direct Studio Phone: <strong>80154 83954</strong>
          </p>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${secureBookingUrl}" style="background-color: #c59b27; color: #0f172a; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block; font-size: 14px; letter-spacing: 0.5px;">VIEW MY BOOKING</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
          <p>1 by 2 Studio • Phone: 80154 83954 • All rights reserved</p>
        </div>
      </div>
    `;

    const emailRes = await sendEmail({
      to: booking.clientEmail,
      subject: `Your Photography Booking Has Been Approved — 1 by 2 Studio`,
      html: emailHtml,
      bookingId: booking.bookingId,
      type: 'booking_approved',
    });

    // 2. Send customer WhatsApp
    const whatsappRes = await sendWhatsappMessage({
      phone: booking.clientPhone,
      clientName: booking.clientName,
      bookingId: booking.bookingId,
      service: booking.service,
      date: booking.preferredDate,
      time: booking.preferredTime || 'Confirmed',
      type: 'booking_approved',
    });

    res.json({
      email: emailRes,
      whatsapp: whatsappRes,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test Email endpoint
app.post('/api/admin/test-email', async (req, res) => {
  const { recipient } = req.body;
  const target = recipient || process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
  const result = await sendEmail({
    to: target,
    subject: 'Test Integration — 1 by 2 Studio',
    html: `<h3>Test Email Delivery</h3><p>This is a real verification test from 1 by 2 Studio integration testing.</p>`,
    type: 'test',
  });
  res.json(result);
});

// Test WhatsApp endpoint
app.post('/api/admin/test-whatsapp', async (req, res) => {
  const { phone } = req.body;
  const target = phone || STUDIO_PHONE;
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

// Get unavailable dates
app.get('/api/availability/unavailable-dates', async (req, res) => {
  try {
    const { getUnavailableDatesOnServer } = await import('./server/src/services/serverFirestore.js');
    const dates = await getUnavailableDatesOnServer();
    res.json({ unavailableDates: dates });
  } catch (err: any) {
    res.status(500).json({ error: err.message, unavailableDates: [] });
  }
});

// Server-side booking creation with conflict check
app.post('/api/bookings/create', async (req, res) => {
  try {
    const bookingData = req.body;
    if (!bookingData || !bookingData.preferredDate || !bookingData.clientName || !bookingData.clientEmail) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const { checkDateConflictOnServer, createBookingOnServer } = await import('./server/src/services/serverFirestore.js');

    const conflictCheck = await checkDateConflictOnServer(bookingData.preferredDate);
    if (conflictCheck.conflict) {
      return res.status(409).json({
        conflict: true,
        error: 'This date/time is no longer available. Please select another date or time.'
      });
    }

    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const bookingId = bookingData.bookingId || `1B2-${year}-${randomNum}`;
    const secureToken = bookingData.secureToken || ('bk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

    const payload = {
      ...bookingData,
      bookingId,
      secureToken,
    };

    const creationResult = await createBookingOnServer(payload);
    if (!creationResult.success) {
      if (creationResult.conflict) {
        return res.status(409).json({
          conflict: true,
          error: 'This date/time is no longer available. Please select another date or time.'
        });
      }
      return res.status(500).json({ error: creationResult.error || 'Failed to create booking' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
    const viewUrl = `${APP_URL}/admin/bookings/${bookingId}`;

    sendEmail({
      to: adminEmail,
      subject: `New Booking Received — 1 by 2 Studio (${bookingId})`,
      html: `<p>New booking received for ${payload.clientName} (${bookingId}). <a href="${viewUrl}">View Booking</a></p>`,
      bookingId,
      type: 'new_booking',
    }).catch(console.error);

    res.json({ success: true, bookingId, secureToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send private client photo gallery link
app.post('/api/galleries/send-link', async (req, res) => {
  try {
    const { bookingId, clientName, clientEmail, clientPhone, secureToken, expiresAt } = req.body;
    if (!clientEmail || !secureToken) {
      return res.status(400).json({ error: 'Missing gallery payload data' });
    }

    const secureGalleryUrl = `${APP_URL}/gallery/${secureToken}`;
    const formattedExpiration = new Date(expiresAt).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #c59b27; margin: 0; font-size: 24px;">1 BY 2 STUDIO</h1>
        <p style="color: #94a3b8; font-size: 13px;">PREMIUM PHOTOGRAPHY STUDIO</p>
        <div style="background: #1e293b; padding: 24px; border-radius: 6px; margin-top: 16px;">
          <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Your Final Photo Gallery Is Ready</h2>
          <p>Hello ${clientName},</p>
          <p>Your final photo gallery from <strong>1 by 2 Studio</strong> is ready.</p>
          <div style="margin: 24px 0;">
            <a href="${secureGalleryUrl}" style="background: #c59b27; color: #0f172a; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">VIEW PHOTO GALLERY</a>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">
            Booking ID: ${bookingId}<br/>
            Gallery Expiration Date: ${formattedExpiration}<br/>
            Studio Phone: 80154 83954
          </p>
        </div>
      </div>
    `;

    const emailRes = await sendEmail({
      to: clientEmail,
      subject: `Your Final Photo Gallery — 1 by 2 Studio`,
      html: emailHtml,
      bookingId,
      type: 'gallery_link',
    });

    let whatsappRes: any = { success: false, status: 'not_configured', error: 'WhatsApp is not configured.' };
    if (clientPhone) {
      whatsappRes = await sendWhatsappMessage({
        phone: clientPhone,
        clientName,
        bookingId,
        secureGalleryUrl,
        expirationDate: formattedExpiration,
        type: 'gallery_link',
      });
    }

    res.json({ email: emailRes, whatsapp: whatsappRes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin CSV Export with authorization check
app.post('/api/admin/bookings/export', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-email'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }

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
      'Admin Notes'
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
    res.setHeader('Content-Disposition', `attachment; filename="1by2_studio_bookings_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In production, serve static files from dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`1 by 2 Studio server running on port ${PORT}`);
});
