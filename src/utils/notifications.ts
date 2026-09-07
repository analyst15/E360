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

/**
 * Dispatches an automated email notification when a new ticket is submitted
 * Recipients: IT Admin (it@elimishawatoto.org) + IT Staff members
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

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Failed to send email notification:', errData);
      return null;
    }

    const data: NotificationResult = await res.json();
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

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Failed to send ticket resolution email notification:', errData);
      return null;
    }

    const data: NotificationResult = await res.json();
    return data;
  } catch (err) {
    console.error('Error dispatching ticket resolution email notification:', err);
    return null;
  }
}

/**
 * Fetch recent notification dispatch logs
 */
export async function getRecentNotificationLogs() {
  try {
    const res = await fetch('/api/notifications/recent');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching notification logs:', err);
    return null;
  }
}
