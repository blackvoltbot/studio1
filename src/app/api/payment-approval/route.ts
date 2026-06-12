import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Handles payment approval/decline requests from external links.
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

  try {
    // DIRECT DOCUMENT LOOKUP: More robust than query for specific ID
    const docRef = doc(firestore, 'payment_requests', requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new NextResponse('Request not found in security database', { status: 404 });
    }

    const status = action === 'approve' ? 'APPROVED' : 'DECLINED';
    await updateDoc(docRef, { status });

    return new NextResponse(`
      <html>
        <body style="background: #050505; color: #f20d0d; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; margin: 0;">
          <div style="border: 1px solid #f20d0d; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(242,13,13,0.3); background: rgba(0,0,0,0.8);">
            <h1 style="text-shadow: 0 0 10px rgba(242,13,13,0.6); margin-bottom: 20px; font-size: 24px; letter-spacing: 2px;">ACTION EXECUTED</h1>
            <p style="color: #ccc; font-size: 14px;">REQUEST_ID: <span style="color: #f20d0d;">${requestId}</span></p>
            <p style="color: #ccc; font-size: 14px;">NEW_STATUS: <strong style="color: #f20d0d;">${status}</strong></p>
            <div style="margin-top: 30px; border-top: 1px solid rgba(242,13,13,0.2); padding-top: 20px;">
              <p style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Security override successful. You may close this window.</p>
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    return new NextResponse(`Operation Failed: ${error.message}`, { status: 500 });
  }
}
