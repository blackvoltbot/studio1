'use server';

import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment, deleteDoc, collection, addDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';
const TELEGRAM_CHAT_ID = '6150562869';

/**
 * Robust JSON extractor for handling responses with trailing characters or multiple objects.
 * Finds the first balanced JSON object in a string.
 */
function extractFirstJson(text: string) {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  if (start === -1) throw new Error('No JSON data detected in operational response.');

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          const jsonStr = trimmed.substring(start, i + 1);
          return JSON.parse(jsonStr);
        }
      }
    }
  }
  
  // Fallback to standard parse if balancing fails but it looks like JSON
  return JSON.parse(trimmed);
}

/**
 * Perform a search lookup. Handles the 1-time free trial logic and coin deduction.
 * Corrected to handle non-standard JSON responses from workers.
 */
export async function performLookupWithDeduction(phone: string, targetNumber: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false, error: 'DB_OFFLINE' };

  try {
    const userRef = doc(firestore, 'users', phone);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const userData = userSnap.data();
    const trialUsed = userData.trialUsed || false;
    const currentCoins = userData.coins || 0;

    // Check if user has free trial or enough coins
    const isFreeTrial = !trialUsed;
    
    if (!isFreeTrial && currentCoins < 5) {
      return { success: false, error: 'INSUFFICIENT_COINS' };
    }

    const baseUrl = process.env.NEW_API_URL || 'https://lynx.mireiariosss.workers.dev/api/chain/';
    const url = `${baseUrl}${targetNumber}`;
    
    console.log(`[LOOKUP] Initiating request to provider for: ${targetNumber}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Black-Detail-Operational-Intelligence/2.0',
      },
      next: { revalidate: 0 }
    });

    const contentType = response.headers.get('content-type') || 'unknown';
    const rawText = await response.text();

    // Server-side telemetry (Securely logged)
    console.log(`[LOOKUP TELEMETRY] Status: ${response.status}`);
    console.log(`[LOOKUP TELEMETRY] Content-Type: ${contentType}`);
    console.log(`[LOOKUP TELEMETRY] Raw Length: ${rawText.length}`);
    if (rawText.length > 0) {
      console.log(`[LOOKUP TELEMETRY] Raw Start: ${rawText.substring(0, 100)}...`);
      console.log(`[LOOKUP TELEMETRY] Raw End: ...${rawText.substring(rawText.length - 100)}`);
    }

    if (!response.ok) {
      throw new Error(`Operational Link Failure: Provider returned ${response.status}`);
    }

    let resultData;
    try {
      // Attempt robust extraction first to handle concatenated JSON/garbage
      resultData = extractFirstJson(rawText);
    } catch (parseError: any) {
      console.error(`[PARSING ERROR] Failed to extract JSON: ${parseError.message}`);
      // Fallback to simpler search if robust extraction fails
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        resultData = JSON.parse(rawText.substring(start, end + 1));
      } else {
        throw new Error('Data Analysis Failure: Response structure is unparseable.');
      }
    }

    // Map to expected frontend format
    const finalData = resultData.result || resultData.data || resultData;

    // Deduct coins or consume trial
    if (isFreeTrial) {
      await updateDoc(userRef, { trialUsed: true });
    } else {
      await updateDoc(userRef, { coins: increment(-5) });
    }

    return { success: true, data: finalData, trialConsumed: isFreeTrial };
  } catch (error: any) {
    console.error('[LOOKUP CRITICAL ERROR]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a coin purchase transaction using Firestore Auto-ID and notifies admin.
 */
export async function requestCoinPackage(phone: string, packageDetails: { amount: number, coins: number }) {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('DB_OFFLINE');

  const txCollectionRef = collection(firestore, 'transactions');
  const docRef = await addDoc(txCollectionRef, {
    userPhone: phone,
    amount: packageDetails.amount,
    coins: packageDetails.coins,
    status: 'pending',
    createdAt: Date.now(),
    processedAt: null
  });

  const transactionId = docRef.id;
  await updateDoc(docRef, { transactionId });

  const message = `
💰 *NEW COIN REQUEST*
🆔 *TXID:* \`${transactionId}\`
📱 *User:* \`${phone}\`
📦 *Package:* ₹${packageDetails.amount} (${packageDetails.coins} Coins)
📅 *Date:* ${new Date().toLocaleString()}

_Action Required: Go to Admin Panel to Approve._
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
    console.error('Telegram Notify Error:', e);
  }

  return { success: true, transactionId };
}

/**
 * Admin: Approve transaction and credit user account instantly.
 */
export async function approveTransaction(transactionId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };

  const txRef = doc(firestore, 'transactions', transactionId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists() || txSnap.data()?.status !== 'pending') return { success: false };

  const { userPhone, coins } = txSnap.data();

  const userRef = doc(firestore, 'users', userPhone);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  await updateDoc(userRef, {
    coins: increment(coins)
  });

  await updateDoc(txRef, { 
    status: 'approved', 
    processedAt: Date.now() 
  });

  if (userData?.fcmToken) {
    try {
      await fetch(`https://fcm.googleapis.com/fcm/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=AIzaSyB4Xb0uEh5obLhnqbJsVVuDEEoEtmw58Qk`
        },
        body: JSON.stringify({
          to: userData.fcmToken,
          notification: {
            title: "Black Retail",
            body: "Your request has been approved",
            icon: "/favicon.ico"
          }
        })
      });
    } catch (e) {
      console.error('FCM Notification Error:', e);
    }
  }

  return { success: true };
}

/**
 * Admin: Decline transaction.
 */
export async function declineTransaction(transactionId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await updateDoc(doc(firestore, 'transactions', transactionId), { 
    status: 'declined', 
    processedAt: Date.now() 
  });
  return { success: true };
}

/**
 * Admin: Remove transaction record.
 */
export async function removeTransaction(transactionId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await deleteDoc(doc(firestore, 'transactions', transactionId));
  return { success: true };
}

/**
 * Admin: Update system configuration.
 */
export async function updateSystemConfig(config: { adminPassword?: string }) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  await setDoc(doc(firestore, 'config', 'system'), config, { merge: true });
  return { success: true };
}

/**
 * Admin: Adjust user coins manually (increment/decrement).
 */
export async function adjustUserCoins(phone: string, amount: number) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  const userRef = doc(firestore, 'users', phone);
  await updateDoc(userRef, {
    coins: increment(amount)
  });
  return { success: true };
}

/**
 * Admin: Set user coins to absolute value.
 */
export async function setUserCoins(phone: string, amount: number) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false };
  const userRef = doc(firestore, 'users', phone);
  await updateDoc(userRef, {
    coins: amount
  });
  return { success: true };
}
