'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Cpu, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const configRef = useMemo(() => db ? doc(db, 'config', 'system') : null, [db]);
  const { data: config, loading: configLoading } = useDoc(configRef);

  useEffect(() => {
    // Check if already logged in and token is still valid
    if (typeof window !== 'undefined' && config) {
      const storedToken = localStorage.getItem('admin_auth_token');
      if (storedToken && storedToken.trim() === config.adminPassword?.trim()) {
        router.push('/admin/dashboard');
      }
    }
  }, [router, config]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (configLoading || !config) {
      toast({ variant: "destructive", title: "Error", description: "Security module still initializing." });
      return;
    }

    setLoading(true);
    const input = password.trim();
    const target = config.adminPassword?.trim();

    if (input && target && input === target) {
      localStorage.setItem('admin_auth_token', target);
      toast({ title: "Authorized", description: "Welcome back, Commander." });
      router.push('/admin/dashboard');
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect administrative credentials." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
      
      <Card className="w-full max-w-md glass-card border-primary/20 z-10">
        <CardHeader className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            {configLoading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Shield className="w-8 h-8 text-primary" />}
          </div>
          <CardTitle className="text-3xl font-headline tracking-tighter text-glow-red uppercase">CORE_ADMIN</CardTitle>
          <CardDescription className="text-xs font-code uppercase tracking-[0.3em] text-muted-foreground mt-2">Administrative Authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-primary/40" />
              <Input
                type="password"
                placeholder="ADMIN_PASSCODE"
                className="bg-black/50 border-primary/20 pl-10 text-primary font-code h-12 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={loading || configLoading}
              />
            </div>
            <Button type="submit" disabled={loading || configLoading} className="w-full h-12 font-bold uppercase tracking-widest pulse-red">
              {loading || configLoading ? "VERIFYING..." : "ACCESS DASHBOARD"}
            </Button>
          </form>
          <div className="mt-8 flex justify-center gap-2">
            <Cpu className="w-3 h-3 text-primary animate-pulse" />
            <p className="text-[10px] text-muted-foreground/50 font-code uppercase tracking-widest">Secure Operational Environment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
