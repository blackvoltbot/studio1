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

    if (settings) {
      const storedAuth = localStorage.getItem('site_auth_token');
      const storedForceLogout = localStorage.getItem('force_logout_version');
      const currentForceLogout = settings.forceLogoutVersion || 0;

      // Handle force logout
      if (storedForceLogout && parseInt(storedForceLogout) < currentForceLogout) {
        localStorage.removeItem('site_auth_token');
        localStorage.removeItem('force_logout_version');
        setIsAuthenticated(false);
        return;
      }

      // Verify token
      if (storedAuth && storedAuth === settings.websitePassword) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      if (!settingsError) {
        setIsAuthenticated(false);
      }
    }
  }, [settings, settingsLoading, settingsError, db, mounted]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsLoading || !settings) return;

    setIsVerifying(true);
    if (passwordInput === settings.websitePassword) {
      localStorage.setItem('site_auth_token', settings.websitePassword);
      localStorage.setItem('force_logout_version', (settings.forceLogoutVersion || 0).toString());
      setIsAuthenticated(true);
      toast({ title: "Access Granted", description: "Welcome to BLACK DETAIL intelligence core." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect security credentials." });
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
      toast({ title: "Success", description: "Security core initialized." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Setup Failed", description: e.message });
    }
    setIsVerifying(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cpu className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  // Show Loading while strictly verifying
  if (settingsLoading || (db && !settings && !settingsError && isAuthenticated === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <Cpu className="w-12 h-12 text-primary animate-pulse" />
          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-code text-primary/50 uppercase tracking-[0.2em]">Synchronizing Core...</p>
        </div>
      </div>
    );
  }

  // Connection Error
  if (settingsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-destructive/30 text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive font-headline tracking-widest uppercase">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">RETRY CONNECTION</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bootstrap UI
  if (!settings && !settingsLoading && db) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow">
          <CardHeader className="text-center space-y-4">
            <Terminal className="w-12 h-12 text-primary mx-auto" />
            <CardTitle className="text-4xl font-headline tracking-tighter text-glow-red">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground font-code uppercase tracking-widest text-xs">Initialization Required</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBootstrap} disabled={isVerifying} className="w-full bg-primary h-12 font-bold tracking-widest pulse-red">
              {isVerifying ? "INITIATING..." : "INITIALIZE SECURITY CORE"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login UI
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-headline text-glow-red mb-4">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground font-code uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-primary" /> Enter Website Password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter Website Password"
                className="bg-black/50 border-primary/20 text-center text-primary font-code"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={isVerifying}
                autoFocus
              />
              <Button type="submit" disabled={isVerifying} className="w-full h-12 font-bold tracking-widest pulse-red">
                {isVerifying ? "VERIFYING..." : "INITIALIZE TERMINAL"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Strictly only show children if verified
  if (isAuthenticated === true) {
    return <>{children}</>;
  }

  return null;
};
