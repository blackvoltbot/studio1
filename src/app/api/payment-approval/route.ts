
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Handles payment approval/decline requests from Telegram inline buttons.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const action = searchParams.get('action');

  if (!requestId || !action) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return new NextResponse('Database connection failed', { status: 500 });
  }

  const requestRef = doc(firestore, 'payment_requests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    return new NextResponse('Request not found', { status: 404 });
  }

  const status = action === 'approve' ? 'APPROVED' : 'DECLINED';
  
  try {
    await updateDoc(requestRef, { status });
    return new NextResponse(`
      <html>
        <body style="background: #050505; color: #f20d0d; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <h1>ACTION EXECUTED</h1>
          <p>Request ${requestId} has been set to: ${status}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new NextResponse('Update failed', { status: 500 });
  }
}
