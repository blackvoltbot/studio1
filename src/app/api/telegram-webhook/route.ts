import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for approval/decline actions.
 * Locates documents by querying the requestId field.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery || !callbackQuery.data) {
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; 
    console.log(`[TELEGRAM WEBHOOK] Received callback: ${data}`);
    
    // Format: pay_{action}_{requestId}
    const parts = data.split('_');
    
    if (parts.length < 3 || parts[0] !== 'pay') {
      console.warn(`[TELEGRAM WEBHOOK] Invalid callback format: ${data}`);
      return NextResponse.json({ ok: true });
    }

    const actionKey = parts[1]; // "ok" or "no"
    const requestId = parts.slice(2).join('_').trim(); // Extract full ID

    console.log(`[TELEGRAM WEBHOOK] Searching for Request ID: ${requestId}`);

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore initialization failure');

    // QUERY BY FIELD: Locate document where requestId field matches
    const q = query(
      collection(firestore, 'payment_requests'), 
      where('requestId', '==', requestId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`[TELEGRAM WEBHOOK] Record not found in intelligence database: ${requestId}`);
      await answerCallbackQuery(
        callbackQuery.id, 
        `❌ Error: Request [${requestId}] not found.`
      );
      return NextResponse.json({ ok: true });
    }

    // Capture the target document reference
    const docRef = querySnapshot.docs[0].ref;
    const newStatus = actionKey === 'ok' ? 'APPROVED' : 'DECLINED';
    
    // Update the record
    await updateDoc(docRef, { status: newStatus });

    console.log(`[TELEGRAM WEBHOOK] Record ${requestId} status updated to: ${newStatus}`);

    // Notify Admin via Telegram Alert
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: ${newStatus} sequence executed for ${requestId}.`
    );

    const timestamp = new Date().toLocaleTimeString();
    const statusIcon = newStatus === 'APPROVED' ? '✅' : '❌';
    
    // Update the original message in the Telegram chat
    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      `${callbackQuery.message.text}\n\n${statusIcon} *STATUS: ${newStatus}*\n🕒 *Timestamp:* ${timestamp}`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK] Critical failure:', error);
    return NextResponse.json({ ok: false, error: error.message });
  }
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: true
      })
    });
  } catch (e) {
    console.error('Failed to answer callback query:', e);
  }
}

async function editMessageText(chatId: number, messageId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error('Failed to edit message text:', e);
  }
}
