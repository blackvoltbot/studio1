'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldAlert, Cpu, Lock, Terminal, AlertCircle, Loader2 } from 'lucide-react';
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

  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'system');
  }, [db]);

  const { data: config, loading: configLoading, error: configError } = useDoc(configRef);

  useEffect(() => {
    if (!mounted || !db || configLoading) return;

    if (config) {
      const storedAuth = localStorage.getItem('site_auth_token');
      // Verify token matches live sitePassword with trimming
      if (storedAuth && storedAuth.trim() === config.sitePassword?.trim()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      // If config is null and no error, we need bootstrap
      if (!configError) {
        setIsAuthenticated(false);
      }
    }
  }, [config, configLoading, configError, db, mounted]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (configLoading || !config) {
      toast({ variant: "destructive", title: "System Error", description: "Security module not ready." });
      return;
    }

    setIsVerifying(true);
    const input = passwordInput.trim();
    const target = config.sitePassword?.trim();

    if (input && target && input === target) {
      localStorage.setItem('site_auth_token', target);
      setIsAuthenticated(true);
      toast({ title: "Access Granted", description: "Terminal initialized." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect terminal credentials." });
    }
    setIsVerifying(false);
  };

  const handleBootstrap = async () => {
    if (!db) return;
    setIsVerifying(true);
    try {
      await setDoc(doc(db, 'config', 'system'), {
        adminPassword: 'Guru112511@G@G',
        sitePassword: 'Ddos11@D'
      });
      toast({ title: "System Ready", description: "Security configuration initialized." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Initialization Error", description: e.message });
    }
    setIsVerifying(false);
  };

  if (!mounted) return null;

  // Loading state
  if (configLoading || (db && !config && !configError && isAuthenticated === null)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-code text-primary uppercase tracking-[0.5em] animate-pulse">Initializing Core...</p>
      </div>
    );
  }

  // Error state
  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-destructive/30 text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive font-headline tracking-widest uppercase">Database Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full bg-destructive/80">RECONNECT</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bootstrap state
  if (!config && !configLoading && db) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow text-center">
          <CardHeader>
            <Terminal className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline tracking-widest text-glow-red uppercase">INIT_REQUIRED</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBootstrap} disabled={isVerifying} className="w-full bg-primary h-12 font-bold tracking-widest pulse-red">
              {isVerifying ? "PREPARING..." : "INITIALIZE SECURITY CORE"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login state
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-glow-red mb-2 uppercase tracking-tighter">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground font-code uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-primary" /> ENCRYPTED_LINK_REQUIRED
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="TERMINAL_PASSCODE"
                className="bg-black/50 border-primary/20 text-center text-primary font-code h-12 focus:ring-primary"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={isVerifying}
                autoFocus
              />
              <Button type="submit" disabled={isVerifying} className="w-full h-12 font-bold tracking-widest pulse-red uppercase">
                {isVerifying ? "VERIFYING..." : "ENGAGE TERMINAL"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
