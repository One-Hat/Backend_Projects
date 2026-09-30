import crypto from 'crypto';

export interface WebhookEventPayload {
  event: 'entry.created' | 'entry.updated' | 'entry.published' | 'entry.unpublished' | 'schema.updated';
  timestamp: string;
  data: any;
}

export class WebhookService {
  /**
   * Generates a cryptographic HMAC-SHA256 signature for the webhook payload
   */
  static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Dispatches a webhook notification to an external subscriber URL
   */
  static async dispatch(targetUrl: string, event: WebhookEventPayload, secret?: string): Promise<{ success: boolean; status?: number; error?: string }> {
    const payloadString = JSON.stringify(event);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Headless-CMS-Webhook-Dispatcher/1.0',
      'X-CMS-Event': event.event,
      'X-CMS-Timestamp': event.timestamp,
    };

    if (secret) {
      const signature = this.generateSignature(payloadString, secret);
      headers['X-CMS-Signature'] = signature;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return { success: res.ok, status: res.status };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
