'use server';

import { initializeFirebase } from '@/firebase/config';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

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

    // After a successful search, mark as USED
    if (requestId) {
      const { firestore } = initializeFirebase();
      if (firestore) {
        const requestRef = doc(firestore, 'requests', requestId);
        updateDoc(requestRef, { used: true }).catch(e => console.error('Failed to mark used:', e));
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
export async function createPaymentRequest(requestId: string, phoneNumber: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('Intelligence database initialization failure');

  const now = new Date();
  const timestamp = now.getTime();

  await setDoc(doc(firestore, 'requests', requestId), {
    requestId,
    phoneNumber,
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: timestamp,
    used: false
  });

  const message = `
🚨 *NEW ACCESS REQUEST*
🆔 *ID:* \`${requestId}\`
📱 *Target:* \`${phoneNumber || 'Not Specified'}\`
💰 *Status:* PENDING PAYMENT
📅 *Date:* ${now.toLocaleString()}

_Awaiting administrative authorization via Dashboard._
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error('Telegram notification dispatch failed.', e);
  }

  return { success: true };
}

/**
 * Admin Action: Approve Request
 */
export async function approveRequest(requestId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await updateDoc(doc(firestore, 'requests', requestId), {
    status: 'approved',
    used: true
  });
  return { success: true };
}

/**
 * Admin Action: Decline Request
 */
export async function declineRequest(requestId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await updateDoc(doc(firestore, 'requests', requestId), {
    status: 'declined'
  });
  return { success: true };
}

/**
 * Admin Action: Delete Request
 */
export async function removeRequest(requestId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await deleteDoc(doc(firestore, 'requests', requestId));
  return { success: true };
}

/**
 * Admin Settings: Update Credentials
 */
export async function updateSystemConfig(config: { adminPassword?: string, sitePassword?: string }) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await setDoc(doc(firestore, 'config', 'system'), config, { merge: true });
  return { success: true };
}
