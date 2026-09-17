export interface WhatsappOptions {
  phone: string;
  templateName?: string;
  bookingId?: string;
  clientName: string;
  service?: string;
  date?: string;
  time?: string;
  customText?: string;
  secureGalleryUrl?: string;
  expirationDate?: string;
  type?: 'booking_approved' | 'booking_rejected' | 'gallery_link' | 'test';
}

export interface WhatsappResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  status: 'sent' | 'failed' | 'not_configured';
}

/**
 * Official Meta WhatsApp Business Cloud API integration.
 * Endpoint: https://graph.facebook.com/{version}/{phone-number-id}/messages
 */
export async function sendWhatsappMessage(options: WhatsappOptions): Promise<WhatsappResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneNumberId) {
    return {
      success: false,
      status: 'not_configured',
      error: 'WhatsApp Business Cloud API credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) not configured in environment.'
    };
  }

  // Format phone to E.164 (strip non-digits)
  let cleanedPhone = options.phone.replace(/\D/g, '');
  if (cleanedPhone.length === 10) {
    cleanedPhone = '91' + cleanedPhone; // Default India prefix for studio phone 80154 83954
  }

  try {
    let messageBody = options.customText || '';

    if (!messageBody) {
      if (options.type === 'gallery_link') {
        messageBody = `Hello ${options.clientName},\n\nYour final photo gallery from 1 by 2 Studio is ready.\n\nYour private gallery link:\n${options.secureGalleryUrl}\n\nThis link expires on:\n${options.expirationDate}\n\n1 by 2 Studio\n80154 83954`;
      } else {
        messageBody = `Hello ${options.clientName},\n\nYour photography booking with 1 by 2 Studio has been approved.\n\nBooking ID: ${options.bookingId || 'N/A'}\nService: ${options.service || 'Photography Session'}\nDate: ${options.date || 'Scheduled'}\nTime: ${options.time || 'Confirmed'}\n\nFor assistance: 80154 83954\nThank you for choosing 1 by 2 Studio.`;
      }
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody,
      }
    };

    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        status: 'failed',
        error: data?.error?.message || `WhatsApp API error: ${res.statusText}`,
      };
    }

    const messageId = data?.messages?.[0]?.id;
    return {
      success: true,
      status: 'sent',
      providerMessageId: messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      error: err.message || 'WhatsApp Cloud API request failed',
    };
  }
}
