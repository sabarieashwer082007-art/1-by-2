import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { sendEmail } from './server/src/services/emailService.js';
import { sendWhatsappMessage } from './server/src/services/whatsappService.js';
import { generateApprovalEmailHtml } from './server/src/services/approvalEmailTemplate.js';
import { approveBookingOnServer, rejectBookingOnServer } from './server/src/services/serverFirestore.js';
import adminRoutes from './server/src/routes/adminRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Admin API Routes (Protected by requireAdmin)
app.use('/api/admin', adminRoutes);

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

// Preview Approval Email HTML
app.post('/api/bookings/preview-email', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking) {
      return res.status(400).json({ error: 'Missing booking payload' });
    }
    const html = generateApprovalEmailHtml({
      bookingId: booking.bookingId || '1B2-2026-DEMO',
      clientName: booking.clientName || 'Valued Client',
      clientEmail: booking.clientEmail || 'client@example.com',
      clientPhone: booking.clientPhone || '80154 83954',
      service: booking.service || 'Fine-Art Wedding',
      preferredDate: booking.preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: booking.preferredTime || '10:00 AM',
      secureToken: booking.secureToken,
      appUrl: APP_URL,
    });
    res.json({ html });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server-side Complete Booking Approval Flow
app.post('/api/bookings/approve', async (req, res) => {
  try {
    const { docId, booking, adminUser, forceResendEmail } = req.body;
    const identifier = docId || booking?.id || booking?.bookingId;
    if (!identifier) {
      return res.status(400).json({ error: 'Missing booking docId or identifier' });
    }

    // 1. Approve booking on Firestore (status: approved, availability: BOOKED, auditLog)
    const approvalResult = await approveBookingOnServer(identifier, adminUser);
    if (!approvalResult.success) {
      return res.status(500).json({ error: approvalResult.error || 'Failed to approve booking' });
    }

    const currentBooking = approvalResult.booking || booking;
    let emailResult: any = { status: 'skipped', reason: 'already_sent' };
    let whatsappResult: any = { status: 'skipped' };

    // 2. Prevent duplicate approval emails unless explicitly requested
    const alreadySent = currentBooking.approval_email_sent === true || currentBooking.emailStatus === 'sent';
    const shouldSendEmail = !alreadySent || forceResendEmail === true;

    if (shouldSendEmail && currentBooking.clientEmail) {
      const emailHtml = generateApprovalEmailHtml({
        bookingId: currentBooking.bookingId,
        clientName: currentBooking.clientName,
        clientEmail: currentBooking.clientEmail,
        clientPhone: currentBooking.clientPhone,
        service: currentBooking.service,
        preferredDate: currentBooking.preferredDate,
        preferredTime: currentBooking.preferredTime,
        secureToken: currentBooking.secureToken,
        appUrl: APP_URL,
      });

      emailResult = await sendEmail({
        to: currentBooking.clientEmail,
        subject: `Your Photography Booking Has Been Approved — 1 by 2 Studio`,
        html: emailHtml,
        bookingId: currentBooking.bookingId,
        type: 'booking_approved',
      });

      // Send WhatsApp
      if (currentBooking.clientPhone) {
        whatsappResult = await sendWhatsappMessage({
          phone: currentBooking.clientPhone,
          clientName: currentBooking.clientName,
          bookingId: currentBooking.bookingId,
          service: currentBooking.service,
          date: currentBooking.preferredDate,
          time: currentBooking.preferredTime || 'Confirmed',
          type: 'booking_approved',
        });
      }
    }

    res.json({
      success: true,
      booking: currentBooking,
      email: emailResult,
      whatsapp: whatsappResult,
      emailSent: shouldSendEmail,
    });
  } catch (err: any) {
    console.error('API /api/bookings/approve error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Server-side Booking Rejection Flow
app.post('/api/bookings/reject', async (req, res) => {
  try {
    const { docId, booking, reason, adminUser } = req.body;
    const identifier = docId || booking?.id || booking?.bookingId;
    if (!identifier) {
      return res.status(400).json({ error: 'Missing booking docId or identifier' });
    }

    const rejectionResult = await rejectBookingOnServer(identifier, reason || 'Scheduling conflict', adminUser);
    if (!rejectionResult.success) {
      return res.status(500).json({ error: rejectionResult.error || 'Failed to reject booking' });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('API /api/bookings/reject error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger customer acceptance email + WhatsApp on approval
app.post('/api/bookings/dispatch-approval', async (req, res) => {
  try {
    const { booking, forceResend } = req.body;
    if (!booking) {
      return res.status(400).json({ error: 'Missing booking payload' });
    }

    // Check duplicate prevention
    if (booking.approval_email_sent && !forceResend) {
      return res.json({
        email: { status: 'skipped', message: 'Approval email already sent previously.' },
        whatsapp: { status: 'skipped', message: 'Approval WhatsApp already sent previously.' },
      });
    }

    const emailHtml = generateApprovalEmailHtml({
      bookingId: booking.bookingId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      service: booking.service,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
      secureToken: booking.secureToken,
      appUrl: APP_URL,
    });

    const emailRes = await sendEmail({
      to: booking.clientEmail,
      subject: `Your Photography Booking Has Been Approved — 1 by 2 Studio`,
      html: emailHtml,
      bookingId: booking.bookingId,
      type: 'booking_approved',
    });

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

// Retry Notification endpoint for Email and WhatsApp
app.post('/api/notifications/retry', async (req, res) => {
  try {
    const { channel, recipient, bookingId, notificationType } = req.body;
    if (!channel || !recipient) {
      return res.status(400).json({ error: 'Channel and recipient are required.' });
    }

    if (channel === 'email') {
      const emailRes = await sendEmail({
        to: recipient,
        subject: `1 by 2 Studio — Notification Update (${bookingId || 'Studio Dispatch'})`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #c59b27;">1 BY 2 STUDIO</h2>
          <p>Notification re-dispatch regarding your reservation <strong>${bookingId || ''}</strong>.</p>
          <p>For inquiries or urgent questions, please contact our studio at 80154 83954.</p>
        </div>`,
        bookingId,
        type: (notificationType as any) || 'manual_resend',
      });
      return res.json(emailRes);
    } else if (channel === 'whatsapp') {
      const whatsappRes = await sendWhatsappMessage({
        phone: recipient,
        clientName: 'Valued Patron',
        bookingId: bookingId || 'N/A',
        service: '1 by 2 Studio Photography',
        type: 'test',
        customText: `Hello,\n\nThis is an updated notification from 1 by 2 Studio regarding reference ${bookingId || ''}.\n\nStudio contact: 80154 83954`,
      });
      return res.json(whatsappRes);
    } else {
      return res.status(400).json({ error: 'Unsupported channel. Must be email or whatsapp.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message, status: 'failed' });
  }
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

// Global safety error handlers to prevent crashes from async stream rejections
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

// Vite dev middleware vs Production static serving
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }

    const PORT = 3000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`1 by 2 Studio server running on port ${PORT}`);
    });

    server.on('error', (err: any) => {
      console.error('[server] Server listen error:', err);
    });

    const shutdown = () => {
      console.log('Gracefully closing HTTP server...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
