import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for approval/decline actions.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery || !callbackQuery.data) {
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; // Expected format: "pay_ok_{requestId}"
    const parts = data.split('_');
    
    // Validate format: prefix (pay), action (ok/no), id (uuid)
    if (parts.length < 3 || parts[0] !== 'pay') {
      return NextResponse.json({ ok: true });
    }

    const actionKey = parts[1]; // "ok" or "no"
    const requestId = parts.slice(2).join('_'); // Extract full ID in case it contains underscores

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore initialization failed');

    const requestRef = doc(firestore, 'payment_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      await answerCallbackQuery(callbackQuery.id, "❌ Error: Request ID not found in security database.");
      return NextResponse.json({ ok: true });
    }

    const newStatus = actionKey === 'ok' ? 'APPROVED' : 'DECLINED';
    
    // Update the exactly matched document ID
    await updateDoc(requestRef, { status: newStatus });

    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: ${newStatus} sequence executed for ID ${requestId.slice(0,8)}.`
    );

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
