
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Handles external manual approval/decline requests via direct document lookup.
 * Corrected to use the "requests" collection.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const action = searchParams.get('action');

  if (!requestId || !action) {
    return new NextResponse('Missing required operational parameters: requestId or action.', { status: 400 });
  }

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return new NextResponse('Secure database connection failed.', { status: 500 });
  }

  try {
    console.log(`[MANUAL APPROVAL] Targeting Request ID: [${requestId}]`);
    
    // Corrected collection path
    const docRef = doc(firestore, 'requests', requestId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`[MANUAL APPROVAL] Record not found: ${requestId}`);
      return new NextResponse(`Operational failure: Request ID [${requestId}] was not located in the "requests" collection.`, { status: 404 });
    }

    const status = action === 'approve' ? 'approved' : 'declined';
    await updateDoc(docRef, { 
      status,
      manualOverride: true,
      processedAt: Date.now()
    });

    return new NextResponse(`
      <html>
        <body style="background: #050505; color: #f20d0d; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; margin: 0; border: 5px solid #111;">
          <div style="border: 1px solid #f20d0d; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(242,13,13,0.3); background: rgba(0,0,0,0.9);">
            <h1 style="text-shadow: 0 0 10px rgba(242,13,13,0.6); margin-bottom: 20px; font-size: 24px; letter-spacing: 2px;">AUTHORIZATION COMPLETED</h1>
            <div style="text-align: left; background: rgba(255,0,0,0.05); padding: 20px; border-radius: 5px; border-left: 2px solid #f20d0d;">
              <p style="color: #ccc; font-size: 14px; margin: 5px 0;">TARGET_ID: <span style="color: #f20d0d;">${requestId}</span></p>
              <p style="color: #ccc; font-size: 14px; margin: 5px 0;">SYSTEM_STATE: <strong style="color: #f20d0d;">${status.toUpperCase()}</strong></p>
            </div>
            <div style="margin-top: 30px; border-top: 1px solid rgba(242,13,13,0.2); padding-top: 20px;">
              <p style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Security records synchronized. Terminal access updated.</p>
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    console.error('[MANUAL APPROVAL] Critical Failure:', error);
    return new NextResponse(`Internal System Error: ${error.message}`, { status: 500 });
  }
}
