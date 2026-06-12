import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for real inline buttons.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery) {
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; // e.g., "approve_uuid"
    if (!data) return NextResponse.json({ ok: true });

    const [action, requestId] = data.split('_');

    if (!action || !requestId) {
      return NextResponse.json({ ok: true });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore initialization failed');

    const requestRef = doc(firestore, 'payment_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      await answerCallbackQuery(callbackQuery.id, "Error: Request record not found in data core.");
      return NextResponse.json({ ok: true });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'DECLINED';
    
    // Update Firestore status
    await updateDoc(requestRef, { status: newStatus });

    // Acknowledge the callback in Telegram
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: Request ${newStatus.toLowerCase()} successfully.`
    );

    // Update the message text to show the action was taken
    const timestamp = new Date().toLocaleTimeString();
    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      `${callbackQuery.message.text}\n\n✅ *ACTION EXECUTED: ${newStatus}*\n🕒 *Processed:* ${timestamp}`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook Operational Failure:', error);
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