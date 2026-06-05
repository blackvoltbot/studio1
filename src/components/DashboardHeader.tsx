'use client';

import React from 'react';
import { Shield, LogOut, Terminal, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const DashboardHeader: React.FC = () => {
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('site_auth_token');
    localStorage.removeItem('force_logout_version');
    window.location.reload();
    toast({
      title: "Logged Out",
      description: "Session terminated successfully."
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/30">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-glow-red font-headline">BLACK DETAIL</h1>
            <div className="flex items-center gap-1.5 -mt-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] text-muted-foreground uppercase font-code">OPERATIONAL_READY</p>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-code uppercase tracking-widest">
            <Activity className="w-3 h-3 text-primary" />
            <span>Node Latency: <span className="text-primary">12ms</span></span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-code uppercase tracking-widest">
            <Terminal className="w-3 h-3 text-primary" />
            <span>Uptime: <span className="text-primary">Active</span></span>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-primary hover:bg-primary/5 font-code text-xs gap-2"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </Button>
        </div>
      </div>
    </header>
  );
};
