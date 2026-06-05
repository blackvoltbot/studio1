'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Lock, ShieldAlert, Cpu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'global');
  }, [db]);

  const { data: settings, loading: settingsLoading } = useDoc(settingsRef);

  useEffect(() => {
    if (settingsLoading || !settings) return;

    const storedAuth = localStorage.getItem('site_auth_token');
    const storedForceLogout = localStorage.getItem('force_logout_version');
    const currentForceLogout = settings.forceLogoutVersion || 0;

    if (storedForceLogout && parseInt(storedForceLogout) < currentForceLogout) {
      localStorage.removeItem('site_auth_token');
      localStorage.removeItem('force_logout_version');
      setIsAuthenticated(false);
      return;
    }

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
  }, [settings, settingsLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsVerifying(true);
    if (passwordInput === settings.websitePassword) {
      localStorage.setItem('site_auth_token', settings.websitePassword);
      localStorage.setItem('force_logout_version', (settings.forceLogoutVersion || 0).toString());
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to BLACK DETAIL."
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

  if (settingsLoading && isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cpu className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-pulse"></div>
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-5xl font-bold tracking-tighter text-glow-red font-headline mb-4">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground/80 font-code uppercase tracking-widest text-xs">Enter Access Cipher</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="SECURITY_KEY_ID"
                  className="bg-black/50 border-primary/20 text-center text-primary font-code focus:border-primary/50"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isVerifying}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isVerifying} className="w-full bg-primary hover:bg-primary/80 text-white font-bold tracking-widest pulse-red transition-all duration-300">
                {isVerifying ? "VERIFYING..." : "INITIALIZE TERMINAL"}
              </Button>
            </form>
          </CardContent>
          <div className="p-4 text-center border-t border-primary/10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldAlert className="w-3 h-3 text-primary" /> Operational security protocol active
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
