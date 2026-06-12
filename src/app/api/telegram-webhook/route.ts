import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for approval/decline actions.
 * callback_data format: pay_ok_{requestId} or pay_no_{requestId}
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery) {
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; // e.g., "pay_ok_uuid"
    if (!data) return NextResponse.json({ ok: true });

    // Robust parsing using split
    const parts = data.split('_');
    const actionKey = parts[1]; // "ok" or "no"
    const requestId = parts[2]; // the uuid

    if (!actionKey || !requestId) {
      console.error('[WEBHOOK] Invalid callback data format:', data);
      return NextResponse.json({ ok: true });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore initialization failed');

    console.log(`[WEBHOOK] Processing ${actionKey} for Request: ${requestId}`);

    // Verify document existence in /payment_requests/{requestId}
    const requestRef = doc(firestore, 'payment_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      console.error(`[WEBHOOK] RECORD_NOT_FOUND: Request ID ${requestId} missing in 'payment_requests' collection.`);
      await answerCallbackQuery(callbackQuery.id, "❌ Error: Request record not found in database.");
      return NextResponse.json({ ok: true });
    }

    const newStatus = actionKey === 'ok' ? 'APPROVED' : 'DECLINED';
    
    // Execute status update
    await updateDoc(requestRef, { status: newStatus });

    // Notify Admin in Telegram
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: ${newStatus} sequence executed.`
    );

    // Update message UI
    const timestamp = new Date().toLocaleTimeString();
    const statusIcon = newStatus === 'APPROVED' ? '✅' : '❌';
    
    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      `${callbackQuery.message.text}\n\n${statusIcon} *STATUS: ${newStatus}*\n🕒 *Processed:* ${timestamp}`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[WEBHOOK] Critical Failure:', error);
    return NextResponse.json({ ok: false, error: error.message });
  }
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: true
    })
  });
}

async function editMessageText(chatId: number, messageId: number, text: string) {
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
}
