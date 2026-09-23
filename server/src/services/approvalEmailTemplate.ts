export interface ApprovalEmailData {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  preferredDate: string;
  preferredTime?: string;
  secureToken?: string;
  appUrl?: string;
}

export function generateApprovalEmailHtml(data: ApprovalEmailData): string {
  const appUrl = data.appUrl || process.env.APP_URL || 'http://localhost:3000';
  const bookingUrl = `${appUrl}/booking/${data.secureToken || data.bookingId}`;
  const studioPhone = '80154 83954';
  const studioEmail = 'contact@1by2studio.com';
  const studioAddress = 'No. 24, Art Lane, Creative Quarter, Chennai, Tamil Nadu - 600004';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photography Booking Approved — 1 by 2 Studio</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F4F1EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1C1A; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column { display: block !important; width: 100% !important; direction: ltr !important; }
      .mobile-padding { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F1EC;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F4F1EC;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 620px; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #D8D2C8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Top Studio Header -->
          <tr>
            <td align="center" style="background-color: #1C1C1A; padding: 36px 30px; border-bottom: 3px solid #6B4F3A;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #D8D2C8; font-weight: 600;">FINE-ART PHOTOGRAPHY ATELIER</p>
              <h1 style="margin: 8px 0 0 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 700; letter-spacing: 2px; color: #F4F1EC;">1 BY 2 STUDIO</h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #C59B27;">CHENNAI · BESPOKE STORIES</p>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 36px 32px 36px;">
              
              <!-- Greeting & Approval Badge -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 6px 18px; background-color: #F4F1EC; border: 1px solid #C59B27; border-radius: 20px; margin-bottom: 20px;">
                      <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #6B4F3A;">✦ BOOKING CONFIRMED & APPROVED ✦</span>
                    </div>
                    <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1C1C1A; font-weight: 700;">Your Session Has Been Approved</h2>
                    <p style="margin: 14px 0 0 0; font-size: 15px; line-height: 1.7; color: #4A4844;">
                      Dear <strong>${data.clientName}</strong>,<br>
                      We are honored to confirm your photography session with <strong>1 by 2 Studio</strong>. Our atelier is dedicated to preserving your moments with quiet elegance, genuine emotion, and timeless artistry.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Booking Details Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; background-color: #FAF8F5; border: 1px solid #D8D2C8; border-radius: 6px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #6B4F3A; border-bottom: 1px solid #D8D2C8; padding-bottom: 8px;">RESERVATION OVERVIEW</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #1C1C1A;">
                      <tr>
                        <td style="padding: 7px 0; color: #66645F; width: 140px;">Booking Ref:</td>
                        <td style="padding: 7px 0; font-family: monospace; font-weight: 700; color: #6B4F3A; font-size: 15px;">${data.bookingId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #66645F;">Discipline / Shoot:</td>
                        <td style="padding: 7px 0; font-weight: 600;">${data.service}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #66645F;">Scheduled Date:</td>
                        <td style="padding: 7px 0; font-weight: 600;">${data.preferredDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #66645F;">Time Slot:</td>
                        <td style="padding: 7px 0; font-weight: 600;">${data.preferredTime || 'Confirmed with Studio'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #66645F;">Status:</td>
                        <td style="padding: 7px 0;"><span style="background-color: #22c55e; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">APPROVED</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="${bookingUrl}" target="_blank" style="display: inline-block; padding: 14px 34px; background-color: #1C1C1A; color: #F4F1EC; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 4px; border: 1px solid #6B4F3A; box-shadow: 0 4px 12px rgba(28,28,26,0.15);">VIEW MY BOOKING</a>
                    <p style="margin: 12px 0 0 0; font-size: 12px; color: #66645F;">Access your real-time session portal, shoot checklist, and private gallery</p>
                  </td>
                </tr>
              </table>

              <!-- Studio Location & Contact -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #D8D2C8;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #6B4F3A;">STUDIO ATELIER DETAILS</p>
                    <p style="margin: 8px 0 4px 0; font-size: 13px; color: #1C1C1A; line-height: 1.6;">
                      <strong>Address:</strong> ${studioAddress}<br>
                      <strong>Studio Phone:</strong> <a href="tel:${studioPhone.replace(/\s+/g, '')}" style="color: #6B4F3A; text-decoration: none; font-weight: bold;">${studioPhone}</a><br>
                      <strong>Studio Email:</strong> <a href="mailto:${studioEmail}" style="color: #6B4F3A; text-decoration: none;">${studioEmail}</a><br>
                      <strong>Direct Inquiries:</strong> Monday – Sunday, 9:00 AM – 8:00 PM IST
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4F1EC; padding: 24px 30px; text-align: center; border-top: 1px solid #D8D2C8;">
              <p style="margin: 0; font-size: 12px; color: #66645F; line-height: 1.6;">
                1 by 2 Studio · Chennai, Tamil Nadu<br>
                Fine-Art Wedding, Editorial, &amp; Heritage Photography<br>
                <a href="${appUrl}" style="color: #6B4F3A; text-decoration: underline; font-size: 12px;">Visit Studio Website</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #8C8A85;">
                This is an automated confirmation of your approved session. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
