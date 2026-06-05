'use server';

import { AuthWrapper } from '@/components/AuthWrapper';
import { MatrixBackground } from '@/components/MatrixBackground';
import { DashboardHeader } from '@/components/DashboardHeader';
import { IntelligenceCenter } from '@/components/IntelligenceCenter';

export default async function Home() {
  return (
    <AuthWrapper>
      <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary selection:text-white">
        <MatrixBackground />
        <div className="scanline opacity-10"></div>
        
        <DashboardHeader />
        
        <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
          <IntelligenceCenter />
        </main>
        
        <footer className="py-6 border-t border-white/5 bg-black/40 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xs text-muted-foreground/50 tracking-widest uppercase font-code">
              [ NUMBER INTEL v2.0.4 // SECURE OPERATIONAL ENVIRONMENT ]
            </p>
          </div>
        </footer>
      </div>
    </AuthWrapper>
  );
}
