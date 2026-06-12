import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for approval/decline actions.
 * Locates documents DIRECTLY using the requestId as the Firestore document ID.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery || !callbackQuery.data) {
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; 
    console.log(`[TELEGRAM WEBHOOK] Incoming Callback: ${data}`);
    
    // Expected format: pay_{action}_{requestId}
    const parts = data.split('_');
    
    if (parts.length < 3 || parts[0] !== 'pay') {
      console.warn(`[TELEGRAM WEBHOOK] Invalid format detected: ${data}`);
      return NextResponse.json({ ok: true });
    }

    const actionKey = parts[1]; // "ok" or "no"
    const requestId = parts.slice(2).join('_').trim(); // Extract the exact ID

    console.log(`[TELEGRAM WEBHOOK] Targeting Document ID: [${requestId}]`);

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore link failure');

    // DIRECT DOCUMENT LOOKUP: requestId is the primary key (Document ID)
    const docRef = doc(firestore, 'payment_requests', requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`[TELEGRAM WEBHOOK] Record not found in database: ${requestId}`);
      await answerCallbackQuery(
        callbackQuery.id, 
        `❌ Operational Error: Request [${requestId}] not found in intelligence database.`
      );
      return NextResponse.json({ ok: true });
    }

    const newStatus = actionKey === 'ok' ? 'APPROVED' : 'DECLINED';
    
    // Execute direct update on the found document
    await updateDoc(docRef, { 
      status: newStatus,
      processedAt: Date.now()
    });

    console.log(`[TELEGRAM WEBHOOK] Request ${requestId} status updated to: ${newStatus}`);

    // Confirm action to Admin
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: ${newStatus} sequence executed successfully for ID: ${requestId}.`
    );

    const timestamp = new Date().toLocaleTimeString();
    const statusIcon = newStatus === 'APPROVED' ? '✅' : '❌';
    
    // Update the original notification message to show current status
    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      `${callbackQuery.message.text}\n\n${statusIcon} *FINAL STATUS:* ${newStatus}\n🕒 *Timestamp:* ${timestamp}`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK] Critical operational failure:', error);
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
    console.error('Failed to answer Telegram callback query:', e);
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
    console.error('Failed to update Telegram message:', e);
  }
}
