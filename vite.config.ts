import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import express from 'express';
import dotenv from 'dotenv';
import { sendEmail } from './server/src/services/emailService.ts';
import { sendWhatsappMessage } from './server/src/services/whatsappService.ts';

dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(express.json({ limit: '10mb' }));
      server.middlewares.use(express.urlencoded({ extended: true, limit: '10mb' }));

      server.middlewares.use('/api/health', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'online',
          studio: '1 by 2 Studio',
          phone: '80154 83954',
          emailConfigured: Boolean(process.env.EMAIL_API_KEY || process.env.SMTP_HOST),
          whatsappConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        }));
      });

      server.middlewares.use('/api/admin/integration-status', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
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
        }));
      });

      server.middlewares.use('/api/notifications/new-booking-email', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        try {
          const booking = req.body?.booking;
          if (!booking) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing booking payload' }));
          }
          const adminEmail = process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const viewUrl = `${appUrl}/admin/bookings/${booking.bookingId}`;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 8px;">
              <h2 style="color: #c59b27; margin-top: 0;">1 BY 2 STUDIO — New Booking Received</h2>
              <p>A new client booking has been submitted.</p>
              <p><strong>Booking ID:</strong> ${booking.bookingId}<br/>
                 <strong>Client Name:</strong> ${booking.clientName}<br/>
                 <strong>Email:</strong> ${booking.clientEmail}<br/>
                 <strong>Phone:</strong> ${booking.clientPhone}<br/>
                 <strong>Service:</strong> ${booking.service}<br/>
                 <strong>Date:</strong> ${booking.preferredDate}<br/>
                 <strong>Time:</strong> ${booking.preferredTime || 'Flexible'}</p>
              <div style="margin-top: 20px;">
                <a href="${viewUrl}" style="background: #c59b27; color: #0f172a; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 4px;">VIEW BOOKING</a>
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

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/bookings/dispatch-approval', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        try {
          const booking = req.body?.booking;
          if (!booking) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing booking payload' }));
          }
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const secureBookingUrl = `${appUrl}/booking/${booking.secureToken || booking.bookingId}`;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 8px;">
              <h2 style="color: #22c55e; margin-top: 0;">Your Photography Booking Has Been Approved — 1 by 2 Studio</h2>
              <p>Hello ${booking.clientName},</p>
              <p>Your photography booking with <strong>1 by 2 Studio</strong> has been approved.</p>
              <p><strong>Booking ID:</strong> ${booking.bookingId}<br/>
                 <strong>Service:</strong> ${booking.service}<br/>
                 <strong>Date:</strong> ${booking.preferredDate}<br/>
                 <strong>Time:</strong> ${booking.preferredTime || 'Confirmed'}</p>
              <p>Direct studio line: <strong>80154 83954</strong></p>
              <div style="margin-top: 20px;">
                <a href="${secureBookingUrl}" style="background: #c59b27; color: #0f172a; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 4px;">VIEW MY BOOKING</a>
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

          const whatsappRes = await sendWhatsappMessage({
            phone: booking.clientPhone,
            clientName: booking.clientName,
            bookingId: booking.bookingId,
            service: booking.service,
            date: booking.preferredDate,
            time: booking.preferredTime || 'Confirmed',
            type: 'booking_approved',
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ email: emailRes, whatsapp: whatsappRes }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/admin/test-email', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        const recipient = req.body?.recipient || process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
        const result = await sendEmail({
          to: recipient,
          subject: 'Test Integration — 1 by 2 Studio',
          html: `<p>Test email from 1 by 2 Studio backend integration verification.</p>`,
          type: 'test',
        });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      });

      server.middlewares.use('/api/admin/test-whatsapp', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        const phone = req.body?.phone || '80154 83954';
        const result = await sendWhatsappMessage({
          phone,
          clientName: 'Test Client',
          bookingId: 'TEST-001',
          service: 'Portfolio Session',
          date: new Date().toISOString().split('T')[0],
          time: '11:00 AM',
          type: 'test',
        });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      });

      server.middlewares.use('/api/notifications/retry', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        try {
          const { channel, recipient, bookingId, notificationType } = req.body;
          let result;
          if (channel === 'email') {
            result = await sendEmail({
              to: recipient,
              subject: `Notification Retry (${notificationType || 'update'}) — 1 by 2 Studio`,
              html: `<p>Notification retry for booking ${bookingId}. Please contact 1 by 2 Studio at 80154 83954 for inquiries.</p>`,
              bookingId,
              type: notificationType || 'retry',
            });
          } else {
            result = await sendWhatsappMessage({
              phone: recipient,
              clientName: 'Patron',
              bookingId,
              type: notificationType || 'retry',
            });
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Get unavailable dates for public calendar
      server.middlewares.use('/api/availability/unavailable-dates', async (req: any, res: any) => {
        try {
          const { getUnavailableDatesOnServer } = await import('./server/src/services/serverFirestore.ts');
          const dates = await getUnavailableDatesOnServer();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ unavailableDates: dates }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message, unavailableDates: [] }));
        }
      });

      // Server-side booking creation with strict conflict check
      server.middlewares.use('/api/bookings/create', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        try {
          const bookingData = req.body;
          if (!bookingData || !bookingData.preferredDate || !bookingData.clientName || !bookingData.clientEmail) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing required booking fields' }));
          }

          const { checkDateConflictOnServer, createBookingOnServer } = await import('./server/src/services/serverFirestore.ts');

          // 1. Mandatory server-side conflict check
          const conflictCheck = await checkDateConflictOnServer(bookingData.preferredDate);
          if (conflictCheck.conflict) {
            res.statusCode = 409;
            return res.end(JSON.stringify({
              conflict: true,
              error: 'This date/time is no longer available. Please select another date or time.'
            }));
          }

          // 2. Generate secure tokens if not passed
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
              res.statusCode = 409;
              return res.end(JSON.stringify({
                conflict: true,
                error: 'This date/time is no longer available. Please select another date or time.'
              }));
            }
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: creationResult.error || 'Failed to create booking' }));
          }

          // 3. Trigger admin email notification in background
          const adminEmail = process.env.ADMIN_EMAIL || 'nilora23x@gmail.com';
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const viewUrl = `${appUrl}/admin/bookings/${bookingId}`;

          sendEmail({
            to: adminEmail,
            subject: `New Booking Received — 1 by 2 Studio (${bookingId})`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 8px;">
                <h2 style="color: #c59b27; margin-top: 0;">1 BY 2 STUDIO — New Booking Received</h2>
                <p>A new client booking has been submitted.</p>
                <p><strong>Booking ID:</strong> ${bookingId}<br/>
                   <strong>Client Name:</strong> ${payload.clientName}<br/>
                   <strong>Email:</strong> ${payload.clientEmail}<br/>
                   <strong>Phone:</strong> ${payload.clientPhone}<br/>
                   <strong>Service:</strong> ${payload.service}<br/>
                   <strong>Date:</strong> ${payload.preferredDate}<br/>
                   <strong>Time:</strong> ${payload.preferredTime || 'Flexible'}</p>
                <div style="margin-top: 20px;">
                  <a href="${viewUrl}" style="background: #c59b27; color: #0f172a; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 4px;">VIEW BOOKING</a>
                </div>
              </div>
            `,
            bookingId,
            type: 'new_booking',
          }).catch(console.error);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, bookingId, secureToken }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Send private client photo gallery link
      server.middlewares.use('/api/galleries/send-link', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        try {
          const { bookingId, clientName, clientEmail, clientPhone, secureToken, expiresAt } = req.body;
          if (!clientEmail || !secureToken) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing gallery payload data' }));
          }

          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const secureGalleryUrl = `${appUrl}/gallery/${secureToken}`;
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
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #c59b27; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 2px;">1 BY 2 STUDIO</h1>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px; letter-spacing: 1px;">PREMIUM PHOTOGRAPHY STUDIO</p>
              </div>
              <div style="background: #1e293b; padding: 24px; border-radius: 6px; border: 1px solid #334155;">
                <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Your Final Photo Gallery Is Ready</h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Hello <strong>${clientName}</strong>,<br/>
                  Your final photo gallery from <strong>1 by 2 Studio</strong> is ready for viewing.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${secureGalleryUrl}" style="background-color: #c59b27; color: #0f172a; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 15px; letter-spacing: 0.5px;">VIEW PHOTO GALLERY</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
                <table style="width: 100%; font-size: 13px; color: #94a3b8;">
                  <tr><td style="padding: 4px 0; width: 150px;">Booking ID:</td><td style="color: #e2e8f0; font-weight: bold;">${bookingId}</td></tr>
                  <tr><td style="padding: 4px 0;">Gallery Expiration:</td><td style="color: #e2e8f0;">${formattedExpiration}</td></tr>
                  <tr><td style="padding: 4px 0;">Studio Phone:</td><td style="color: #c59b27; font-weight: bold;">80154 83954</td></tr>
                </table>
              </div>
              <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
                <p>1 by 2 Studio • Phone: 80154 83954 • All rights reserved</p>
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

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ email: emailRes, whatsapp: whatsappRes }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Admin CSV Export with authorization check and filters
      server.middlewares.use('/api/admin/bookings/export', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        try {
          const authHeader = req.headers['authorization'] || req.headers['x-admin-email'];
          if (!authHeader) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Unauthorized: Admin authentication required.' }));
          }

          const { bookings = [] } = req.body;

          // Build CSV string with proper RFC 4180 escaping
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
          res.end(csvContent);
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
