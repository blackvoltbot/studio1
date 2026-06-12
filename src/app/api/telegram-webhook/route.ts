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
    const [action, requestId] = data.split('_');

    if (!action || !requestId) {
      return NextResponse.json({ ok: true });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore not initialized');

    const requestRef = doc(firestore, 'payment_requests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      await answerCallbackQuery(callbackQuery.id, "Error: Request not found in database.");
      return NextResponse.json({ ok: true });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'DECLINED';
    await updateDoc(requestRef, { status: newStatus });

    // Acknowledge the callback in Telegram
    await answerCallbackQuery(
      callbackQuery.id, 
      `Request ${newStatus.toLowerCase()} successfully.`
    );

    // Update the message text to show the action was taken
    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      `${callbackQuery.message.text}\n\n✅ **ACTION EXECUTED: ${newStatus}**`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
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
