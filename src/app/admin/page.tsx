
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root Admin Route
 * Automatically redirects to the dashboard. The dashboard handles
 * authentication verification and redirects to /admin/login if needed.
 */
export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-[10px] font-code text-primary uppercase tracking-[0.5em]">
        Redirecting to Admin Core...
      </div>
    </div>
  );
}
