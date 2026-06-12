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
      console.log('[TELEGRAM WEBHOOK] Received request without callback data.');
      return NextResponse.json({ ok: true });
    }

    const data = callbackQuery.data; 
    console.log(`[TELEGRAM WEBHOOK] Incoming Callback Data: "${data}"`);
    
    // Expected format: pay_{action}_{requestId}
    // Action is "ok" (approve) or "no" (decline)
    const parts = data.split('_');
    
    if (parts.length < 3 || parts[0] !== 'pay') {
      console.warn(`[TELEGRAM WEBHOOK] Invalid callback data format detected: ${data}`);
      return NextResponse.json({ ok: true });
    }

    const actionKey = parts[1]; // "ok" or "no"
    // Join back the rest in case the requestId contains underscores
    const requestId = parts.slice(2).join('_').trim();

    if (!requestId) {
      console.error('[TELEGRAM WEBHOOK] Extracted requestId is empty');
      return NextResponse.json({ ok: true });
    }

    console.log(`[TELEGRAM WEBHOOK] Attempting Direct Document Lookup for ID: [${requestId}]`);

    const { firestore } = initializeFirebase();
    if (!firestore) {
      console.error('[TELEGRAM WEBHOOK] Firestore initialization failed.');
      throw new Error('Firestore initialization failure');
    }

    // DIRECT DOCUMENT LOOKUP: requestId is the primary key (Document ID)
    const docRef = doc(firestore, 'payment_requests', requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`[TELEGRAM WEBHOOK] NOT FOUND: Record [${requestId}] does not exist in collection "payment_requests".`);
      await answerCallbackQuery(
        callbackQuery.id, 
        `❌ ERROR: Request [${requestId}] not located in database.`
      );
      return NextResponse.json({ ok: true });
    }

    const currentData = docSnap.data();
    console.log(`[TELEGRAM WEBHOOK] Document Found. Current Status: ${currentData.status}`);

    const newStatus = actionKey === 'ok' ? 'APPROVED' : 'DECLINED';
    
    // Execute direct update on the verified document
    await updateDoc(docRef, { 
      status: newStatus,
      processedAt: Date.now()
    });

    console.log(`[TELEGRAM WEBHOOK] SUCCESS: Request ${requestId} status updated to: ${newStatus}`);

    // Notify the admin via alert in Telegram
    await answerCallbackQuery(
      callbackQuery.id, 
      `SYSTEM: Authorization ${newStatus} for ID: ${requestId}.`
    );

    const timestamp = new Date().toLocaleTimeString();
    const statusIcon = newStatus === 'APPROVED' ? '✅' : '❌';
    
    // Update the original message to reflect the final operational state
    const originalText = callbackQuery.message.text || '';
    const updatedText = `${originalText}\n\n${statusIcon} *STATUS UPDATED:* ${newStatus}\n🕒 *Processed At:* ${timestamp}`;

    await editMessageText(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      updatedText
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TELEGRAM WEBHOOK] Critical System Error:', error);
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
    console.error('Telegram API Failure (answerCallbackQuery):', e);
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
    console.error('Telegram API Failure (editMessageText):', e);
  }
}
