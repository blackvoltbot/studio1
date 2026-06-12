'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldAlert, Cpu, Lock, Terminal, AlertCircle } from 'lucide-react';
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
      // Verify token matches live sitePassword
      if (storedAuth && storedAuth === config.sitePassword) {
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
    if (configLoading || !config) return;

    setIsVerifying(true);
    if (passwordInput === config.sitePassword) {
      localStorage.setItem('site_auth_token', config.sitePassword);
      setIsAuthenticated(true);
      toast({ title: "Access Granted", description: "Terminal initialized." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect credentials." });
    }
    setIsVerifying(false);
  };

  const handleBootstrap = async () => {
    if (!db) return;
    setIsVerifying(true);
    try {
      await setDoc(doc(db, 'config', 'system'), {
        adminPassword: 'Guru112511@G@G',
        sitePassword: '1234'
      });
      toast({ title: "System Ready", description: "Security config initialized." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Initialization Error", description: e.message });
    }
    setIsVerifying(false);
  };

  if (!mounted) return null;

  // Handle stuck initializing state
  if (configLoading || (db && !config && !configError && isAuthenticated === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cpu className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-destructive/30 text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive font-headline tracking-widest uppercase">Connection Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full bg-destructive/80">RECONNECT</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle missing config (Bootstrap)
  if (!config && !configLoading && db) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow text-center">
          <CardHeader>
            <Terminal className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline tracking-widest text-glow-red uppercase">INIT REQUIRED</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBootstrap} className="w-full bg-primary h-12 font-bold tracking-widest pulse-red">INITIALIZE SYSTEM</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-glow-red mb-2 uppercase">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground font-code uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-primary" /> SECURE_LINK_REQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Terminal Password"
                className="bg-black/50 border-primary/20 text-center text-primary font-code h-12"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={isVerifying}
                autoFocus
              />
              <Button type="submit" disabled={isVerifying} className="w-full h-12 font-bold tracking-widest pulse-red">ENGAGE TERMINAL</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
