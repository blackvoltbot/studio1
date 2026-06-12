import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for approval/decline actions.
 * Updates Firestore status in real-time based on admin interaction.
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
    const requestId = parts.slice(2).join('_').trim(); // Extract and clean full ID

    console.log(`[TELEGRAM WEBHOOK] Target Request ID: ${requestId}`);

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore initialization failure');

    // DIRECT LOOKUP: The requestId is the Document ID
    const docRef = doc(firestore, 'payment_requests', requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`[TELEGRAM WEBHOOK] Record not found: ${requestId}`);
      await answerCallbackQuery(
        callbackQuery.id, 
        `❌ Error: Request [${requestId}] not found in intelligence database.`
      );
      return NextResponse.json({ ok: true });
    }

    const newStatus = actionKey === 'ok' ? 'APPROVED' : 'DECLINED';
    
    // Update the record
    await updateDoc(docRef, { status: newStatus });

    console.log(`[TELEGRAM WEBHOOK] Status updated to: ${newStatus}`);

    // Notify Admin via Telegram Alert
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: ${newStatus} sequence executed successfully.`
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
