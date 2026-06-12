
'use server';

import { initializeFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';
const TELEGRAM_CHAT_ID = '6150562869';

/**
 * Performs a mobile intelligence lookup using the external provider.
 */
export async function performLookup(number: string, requestId?: string) {
  const apiKey = '@Adarsh_330';
  const url = `https://sbsakib.eu.cc/apis/num_info_v1?key=${apiKey}&num=${number}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Operational link returned status ${response.status}`);
    }

    const data = await response.json();

    // After a successful search, invalidate the payment request
    if (requestId) {
      const { firestore } = initializeFirebase();
      if (firestore) {
        const requestRef = doc(firestore, 'payment_requests', requestId);
        updateDoc(requestRef, { status: 'USED' }).catch(e => console.error('Failed to mark used:', e));
      }
    }

    if (data && data.success === false) {
      return { 
        success: false, 
        error: data.message || data.error || 'Provider failed to retrieve data.' 
      };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Secure link established but no data returned.' };
  }
}

/**
 * Creates a payment request and notifies admin via Telegram.
 */
export async function createPaymentRequest(requestId: string, sessionId: string, host: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('DB connection failed');

  const now = new Date();
  const timestamp = now.getTime();

  // 1. Save to Firestore
  await setDoc(doc(firestore, 'payment_requests', requestId), {
    requestId,
    sessionId,
    status: 'WAITING_APPROVAL',
    timestamp,
    amount: 5
  });

  // 2. Prepare Telegram message
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  
  const message = `
🚨 *NEW PAYMENT REQUEST*
🆔 Request ID: ${requestId}
📅 Date: ${dateStr}
🕒 Time: ${timeStr}
👤 Session: ${sessionId}
💰 Amount: ₹5
📊 Status: Waiting Approval
  `.trim();

  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const keyboard = {
    inline_keyboard: [[
      { text: '✅ Approve', url: `${baseUrl}/api/payment-approval?requestId=${requestId}&action=approve` },
      { text: '❌ Decline', url: `${baseUrl}/api/payment-approval?requestId=${requestId}&action=decline` }
    ]]
  };

  // 3. Send to Telegram
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  });

  return { success: true };
}
