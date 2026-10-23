
interface RejectionEmailData {
  bookingId: string;
  clientName: string;
  service: string;
  preferredDate: string;
  reason: string;
}

export function generateRejectionEmailHtml(
  data: RejectionEmailData
): string {
  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[char];
    });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Update - 1 by 2 Studio</title>
</head>
<body style="margin:0;padding:24px;background:#F4F1EC;font-family:Arial,sans-serif;color:#1C1C1A;">
  <div style="max-width:600px;margin:auto;background:#FFFFFF;border:1px solid #D8D2C8;border-radius:8px;overflow:hidden;">
    <div style="padding:28px;background:#1C1C1A;color:#F4F1EC;text-align:center;">
      <h1 style="margin:0;">1 BY 2 STUDIO</h1>
      <p style="margin-bottom:0;">Photography Booking Update</p>
    </div>
    <div style="padding:30px;line-height:1.7;">
      <p>Dear <strong>${escapeHtml(data.clientName || 'Client')}</strong>,</p>
      <p>Thank you for choosing 1 by 2 Studio. Unfortunately, we are unable to confirm your booking at this time.</p>
      <p><strong>Booking reference:</strong> ${escapeHtml(data.bookingId || 'N/A')}</p>
      <p><strong>Service:</strong> ${escapeHtml(data.service || 'Photography session')}</p>
      <p><strong>Preferred date:</strong> ${escapeHtml(data.preferredDate || 'Not specified')}</p>
      <p><strong>Reason:</strong> ${escapeHtml(data.reason || 'Scheduling conflict')}</p>
      <p>We apologize for the inconvenience. Please contact our studio if you would like to discuss other available dates.</p>
      <p>Regards,<br><strong>1 by 2 Studio</strong></p>
    </div>
  </div>
</body>
</html>`;
}
