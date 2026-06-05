'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldAlert, Cpu, Lock, Terminal, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'global');
  }, [db]);

  const { data: settings, loading: settingsLoading, error: settingsError } = useDoc(settingsRef);

  useEffect(() => {
    if (!mounted || !db || settingsLoading) return;

    // Handle authentication logic only when settings data is available
    if (settings) {
      const storedAuth = localStorage.getItem('site_auth_token');
      const storedForceLogout = localStorage.getItem('force_logout_version');
      const currentForceLogout = settings.forceLogoutVersion || 0;

      // Handle force logout scenario
      if (storedForceLogout && parseInt(storedForceLogout) < currentForceLogout) {
        localStorage.removeItem('site_auth_token');
        localStorage.removeItem('force_logout_version');
        setIsAuthenticated(false);
        return;
      }

      // Verify stored token against current password
      if (storedAuth && storedAuth !== settings.websitePassword) {
        localStorage.removeItem('site_auth_token');
        setIsAuthenticated(false);
        return;
      }

      if (storedAuth === settings.websitePassword) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      // If we are not loading, have no error, but also have no data, it's actually missing
      if (!settingsError) {
        setIsAuthenticated(false);
      }
    }
  }, [settings, settingsLoading, settingsError, db, mounted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (settingsLoading || !settings) return;

    setIsVerifying(true);
    
    if (passwordInput === settings.websitePassword) {
      localStorage.setItem('site_auth_token', settings.websitePassword);
      localStorage.setItem('force_logout_version', (settings.forceLogoutVersion || 0).toString());
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to BLACK DETAIL intelligence core."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Incorrect security credentials."
      });
    }
    setIsVerifying(false);
  };

  const handleBootstrap = async () => {
    if (!db) return;
    setIsVerifying(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        websitePassword: 'Admin123',
        forceLogoutVersion: 1
      });
      toast({
        title: "Success",
        description: "Security core initialized. Default password: Admin123"
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: e.message
      });
    }
    setIsVerifying(false);
  };

  // 1. Initial mounting check
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cpu className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  // 2. Wait for DB and settings to load
  if (settingsLoading || (db && !settings && !settingsError && isAuthenticated === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <Cpu className="w-12 h-12 text-primary animate-pulse" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <p className="text-[10px] font-code text-primary/50 uppercase tracking-[0.2em]">Synchronizing Core...</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Handle persistent errors (e.g., permissions or network)
  if (settingsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-destructive/30">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive font-headline tracking-widest uppercase">Connection Error</CardTitle>
            <CardDescription className="text-muted-foreground font-code text-xs">
              {settingsError.message || "Failed to establish a secure link to the security core."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30">
              RETRY CONNECTION
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. BOOTSTRAP UI: Only if doc is explicitly missing after loading finished
  if (!settings && !settingsLoading && !settingsError && db) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-pulse"></div>
          <CardHeader className="text-center space-y-4">
            <Terminal className="w-12 h-12 text-primary mx-auto" />
            <CardTitle className="text-4xl font-bold tracking-tighter text-glow-red font-headline">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-code uppercase tracking-widest text-xs">
              Security Protocol Initialization Required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
              <p className="text-[10px] font-code text-primary/80 leading-relaxed uppercase">
                The global security document 'settings/global' was not detected. Manual initialization is required to establish the operational cipher.
              </p>
            </div>
            <Button 
              onClick={handleBootstrap} 
              disabled={isVerifying} 
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold tracking-widest pulse-red h-12"
            >
              {isVerifying ? "INITIATING..." : "INITIALIZE SECURITY CORE"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 5. LOGIN UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-pulse"></div>
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-5xl font-bold tracking-tighter text-glow-red font-headline mb-4">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-code uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-primary" /> Enter Website Password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter Website Password"
                  className="bg-black/50 border-primary/20 text-center text-primary font-code focus:border-primary/50 placeholder:text-primary/20"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isVerifying}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isVerifying} className="w-full bg-primary hover:bg-primary/80 text-white font-bold tracking-widest pulse-red h-12">
                {isVerifying ? "VERIFYING..." : "INITIALIZE TERMINAL"}
              </Button>
            </form>
          </CardContent>
          <div className="p-4 text-center border-t border-primary/10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3 text-primary" /> Operational security protocol active
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
