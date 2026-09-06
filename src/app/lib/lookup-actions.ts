'use server';

import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment, deleteDoc, collection, addDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';
const TELEGRAM_CHAT_ID = '6150562869';

/**
 * Perform a search lookup. Handles the 1-time free trial logic and coin deduction.
 * Updated to use the new Lynx worker API integration.
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

    // NEW API INTEGRATION: Using the Lynx Worker endpoint
    // The base URL is kept on the server side for security.
    const baseUrl = process.env.NEW_API_URL || 'https://lynx.mireiariosss.workers.dev/api/chain/';
    const url = `${baseUrl}${targetNumber}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Black-Detail-Operational-Intelligence/2.0',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error('Operational Link Failure: Provider Unreachable');
    const data = await response.json();

    // Adapter/Mapper: The frontend expects the JSON directly as 'data'
    // If the new API has a nested structure, we ensure the result is passed correctly.
    const resultData = data.result || data;

    // Deduct coins or consume trial
    if (isFreeTrial) {
      await updateDoc(userRef, {
        trialUsed: true
      });
    } else {
      await updateDoc(userRef, {
        coins: increment(-5)
      });
    }

    return { success: true, data: resultData, trialConsumed: isFreeTrial };
  } catch (error: any) {
    console.error('[LOOKUP ERROR]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a coin purchase transaction using Firestore Auto-ID and notifies admin.
 */
export async function requestCoinPackage(phone: string, packageDetails: { amount: number, coins: number }) {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('DB_OFFLINE');

  // Use Firestore addDoc for strictly Auto-generated ID
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

  // Update the document to include its own ID as a field for easy search/sync
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

  // Credit the user account
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

  // Trigger FCM Notification
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
