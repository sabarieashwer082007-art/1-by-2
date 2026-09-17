export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  bookingId?: string;
  type: 'new_booking' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'manual_resend' | 'test' | 'gallery_link';
}

export interface EmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  status: 'sent' | 'failed' | 'not_configured';
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';
  const apiKey = process.env.EMAIL_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || '1 by 2 Studio <onboarding@resend.dev>';

  // If no credentials configured, report not_configured with explicit status so UI informs admin honestly
  if (!apiKey && !process.env.SMTP_HOST) {
    return {
      success: false,
      status: 'not_configured',
      error: 'Email service credentials (EMAIL_API_KEY or SMTP_HOST) are not configured in environment secrets.'
    };
  }

  try {
    if (provider === 'resend' && apiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: 'failed',
          error: data?.message || `Resend error: ${res.statusText}`,
        };
      }

      return {
        success: true,
        status: 'sent',
        providerMessageId: data.id,
      };
    }

    // SMTP / generic provider fallback via REST if needed or configured
    return {
      success: false,
      status: 'not_configured',
      error: 'Configured email provider driver is not initialized.',
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      error: err.message || 'Unknown network error sending email',
    };
  }
}
