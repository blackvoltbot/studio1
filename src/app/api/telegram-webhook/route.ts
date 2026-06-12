
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';

/**
 * Handles Telegram callback queries for approval/decline actions.
 * Corrected to use the "requests" collection.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery || !callbackQuery.data) {
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; 
    console.log(`[TELEGRAM WEBHOOK] Incoming Callback: "${data}"`);
    
    // Expected format: pay_{action}_{requestId}
    const parts = data.split('_');
    
    if (parts.length < 3 || parts[0] !== 'pay') {
      console.warn(`[TELEGRAM WEBHOOK] Invalid callback format: ${data}`);
      return NextResponse.json({ ok: true });
    }

    const actionKey = parts[1]; // "ok" or "no"
    const requestId = parts.slice(2).join('_').trim();

    if (!requestId) {
      console.error('[TELEGRAM WEBHOOK] Extracted requestId is empty');
      return NextResponse.json({ ok: true });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) {
      console.error('[TELEGRAM WEBHOOK] Firestore instance unavailable.');
      return NextResponse.json({ ok: false, error: 'DB_UNAVAILABLE' });
    }

    // DIRECT DOCUMENT LOOKUP: requestId is the primary key (Document ID)
    const docRef = doc(firestore, 'requests', requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`[TELEGRAM WEBHOOK] NOT FOUND: Record [${requestId}] does not exist in collection "requests".`);
      await answerCallbackQuery(
        callbackQuery.id, 
        `❌ ERROR: Request [${requestId}] was not found in the database.`
      );
      return NextResponse.json({ ok: true });
    }

    const newStatus = actionKey === 'ok' ? 'approved' : 'declined';
    
    // Execute direct update
    await updateDoc(docRef, { 
      status: newStatus,
      updatedAt: Date.now(),
      updatedBy: 'TELEGRAM_BOT'
    });

    console.log(`[TELEGRAM WEBHOOK] SUCCESS: Request ${requestId} -> ${newStatus}`);

    // Notify admin via callback alert
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: Authorization ${newStatus.toUpperCase()} for ID: ${requestId}.`
    );

    const timestamp = new Date().toLocaleTimeString();
    const statusIcon = newStatus === 'approved' ? '✅' : '❌';
    
    // Update original Telegram message text
    const originalText = callbackQuery.message?.text || 'Operational Record';
    const updatedText = `${originalText}\n\n${statusIcon} *STATUS:* ${newStatus.toUpperCase()}\n🕒 *Processed:* ${timestamp}`;

    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      updatedText
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK] CRITICAL FAILURE:', error);
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
    console.error('Telegram API Error (answerCallbackQuery):', e);
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
    console.error('Telegram API Error (editMessageText):', e);
  }
}
