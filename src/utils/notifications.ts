import { Ticket } from '../types';

export interface NotificationResult {
  success: boolean;
  message: string;
  recipients: string[];
  ticketNumber: string;
  status: 'sent' | 'simulated';
  messageId?: string;
  dispatchedAt: string;
}

async function safeParseJson<T>(res: Response): Promise<{ ok: boolean; data: T | null; rawText: string }> {
  const rawText = await res.text();
  try {
    const data = JSON.parse(rawText) as T;
    return { ok: res.ok, data, rawText };
  } catch {
    return { ok: false, data: null, rawText };
  }
}

/**
 * Dispatches an automated email notification when a new ticket is submitted.
 * Recipient: IT Administrator ONLY (it@elimishawatoto.org)
 */
export async function sendTicketCreatedNotification(
  ticket: Ticket,
  staffEmails?: string[]
): Promise<NotificationResult | null> {
  try {
    const res = await fetch('/api/notifications/ticket-created', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket,
        staffEmails: staffEmails || [],
      }),
    });

    const { ok, data } = await safeParseJson<NotificationResult>(res);
    if (!ok || !data) {
      console.warn('Failed to send email notification:', data);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error dispatching ticket email notification:', err);
    return null;
  }
}

/**
 * Dispatches an automated email notification to an employee once their support ticket is resolved
 * Recipient: The employee who submitted the ticket (ticket.reporterEmail)
 */
export async function sendTicketResolvedNotification(
  ticket: Ticket,
  resolutionNotes?: string,
  resolvedBy?: string
): Promise<NotificationResult | null> {
  try {
    const res = await fetch('/api/notifications/ticket-resolved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket,
        resolutionNotes,
        resolvedBy,
      }),
    });

    const { ok, data } = await safeParseJson<NotificationResult>(res);
    if (!ok || !data) {
      console.warn('Failed to send ticket resolution email notification:', data);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error dispatching ticket resolution email notification:', err);
    return null;
  }
}

/**
 * Fetch recent notification dispatch logs and Google Workspace SMTP status
 */
export async function getRecentNotificationLogs() {
  try {
    const res = await fetch('/api/notifications/recent');
    const { ok, data } = await safeParseJson<any>(res);
    if (!ok || !data) return null;
    return data;
  } catch (err) {
    console.error('Error fetching notification logs:', err);
    return null;
  }
}

export interface TestEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  hint?: string;
  messageId?: string;
  recipient?: string;
  sender?: string;
}

/**
 * Sends a live verification test email through Google Workspace SMTP
 */
export async function testSmtpConnection(
  targetEmail?: string,
  customCredentials?: { smtpUser?: string; smtpPass?: string }
): Promise<TestEmailResponse> {
  try {
    const res = await fetch('/api/notifications/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetEmail,
        ...(customCredentials || {}),
      }),
    });

    const { ok, data, rawText } = await safeParseJson<TestEmailResponse>(res);

    if (data && typeof data === 'object') {
      return data;
    }

    // Handled non-JSON error response (e.g. from Vercel Serverless Function or proxy)
    const cleanSnippet = rawText.replace(/<[^>]*>/g, '').trim().slice(0, 250);
    return {
      success: false,
      error: cleanSnippet || `Server error (${res.status} ${res.statusText})`,
      hint: res.status === 500
        ? 'The backend serverless function or API route returned an error. Check server logs.'
        : 'Please verify server connectivity.',
    };
  } catch (err: any) {
    console.error('Failed to test SMTP connection:', err);
    return {
      success: false,
      error: err.message || 'Network error while attempting to test SMTP delivery',
      hint: 'Check network connectivity or backend server availability.',
    };
  }
}

/**
 * Updates runtime Google Workspace credentials
 */
export async function updateSmtpConfig(config: { smtpUser: string; smtpPass: string }) {
  try {
    const res = await fetch('/api/notifications/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const { data } = await safeParseJson<any>(res);
    return data || { success: false, error: 'Invalid response from server' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

