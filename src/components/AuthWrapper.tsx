'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { ShieldAlert, Cpu, Lock, Terminal, AlertCircle, Loader2, Phone, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, initializeFirebase } from '@/firebase';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const VAPID_KEY = 'BGMuHwdwqwd4aD8IGkEhUtW4YSF4zhQj3NnjcWUzrWZ65jFWq7DrC-PhFS5JCwt38uuMLkhkwB98kLsNiBVppiI';

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
    const savedPhone = localStorage.getItem('bd_user_phone');
    if (savedPhone) setCurrentUser(savedPhone);
  }, []);

  // FCM Logic
  useEffect(() => {
    if (mounted && currentUser && db) {
      const registerFCM = async () => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            const { isSupported, getMessaging, getToken, onMessage } = await import('firebase/messaging');
            const supported = await isSupported();
            if (!supported) return;

            const { app } = initializeFirebase();
            if (!app) return;

            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
              const token = await getToken(messaging, { vapidKey: VAPID_KEY });
              if (token) {
                const userRef = doc(db, 'users', currentUser);
                await updateDoc(userRef, { fcmToken: token });
              }
            }

            onMessage(messaging, (payload) => {
              toast({
                title: payload.notification?.title || "Notification",
                description: payload.notification?.body || "",
              });
            });
          } catch (error) {
            console.error('FCM Error:', error);
          }
        }
      };
      registerFCM();
    }
  }, [mounted, currentUser, db, toast]);

  const configRef = useMemo(() => db ? doc(db, 'config', 'system') : null, [db]);
  const { data: config, loading: configLoading, error: configError } = useDoc(configRef);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    const phone = phoneInput.trim();
    const pass = passwordInput.trim();

    if (!phone || !pass) {
      toast({ variant: "destructive", title: "Data Missing", description: "Phone and Password are required." });
      return;
    }

    setIsVerifying(true);
    try {
      const userRef = doc(db, 'users', phone);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.password === pass) {
          localStorage.setItem('bd_user_phone', phone);
          setCurrentUser(phone);
          toast({ title: "Authorized", description: "Operational link established." });
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials." });
        }
      } else {
        await setDoc(userRef, {
          phoneNumber: phone,
          password: pass,
          coins: 0,
          trialUsed: false,
          createdAt: Date.now()
        });
        localStorage.setItem('bd_user_phone', phone);
        setCurrentUser(phone);
        toast({ title: "Account Initialized", description: "1 Free Scan available." });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Error", description: e.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBootstrap = async () => {
    if (!db) return;
    setIsVerifying(true);
    try {
      // Config init
      await setDoc(doc(db, 'config', 'system'), {
        adminPassword: 'Guru112511@G@G'
      });

      // Default packages init
      const pkgRef = collection(db, 'packages');
      const pkgSnap = await getDocs(pkgRef);
      if (pkgSnap.empty) {
        const defaults = [
          { name: "Starter", coins: 20, amount: 50 },
          { name: "Standard", coins: 45, amount: 100 },
          { name: "Pro", coins: 300, amount: 500 },
          { name: "Enterprise", coins: 900, amount: 1000 }
        ];
        for (const p of defaults) {
          await addDoc(pkgRef, { ...p, createdAt: Date.now() });
        }
      }

      toast({ title: "System Initialized", description: "Master credentials and default packages synchronized." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Bootstrap Error", description: e.message });
    }
    setIsVerifying(false);
  };

  if (!mounted) return null;

  if (configLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-code text-primary uppercase tracking-[0.5em]">Syncing Security Core...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-destructive/30 text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive font-headline tracking-widest uppercase">CORE_OFFLINE</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full bg-destructive/80 font-code text-xs uppercase">RECONNECT</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!config && db) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <Card className="w-full max-w-md glass-card border-primary/30">
          <CardHeader>
            <Terminal className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline tracking-widest uppercase">INIT_REQUIRED</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBootstrap} disabled={isVerifying} className="w-full bg-primary font-bold tracking-widest uppercase pulse-red">
              {isVerifying ? "PREPARING..." : "INITIALIZE SECURITY CORE"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="scanline"></div>
        <Card className="w-full max-w-md glass-card border-primary/30 red-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline text-glow-red mb-2 uppercase tracking-tighter">BLACK DETAIL</CardTitle>
            <CardDescription className="text-muted-foreground font-code uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-primary" /> SYSTEM_AUTHENTICATION
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-primary/40" />
                <Input
                  type="text"
                  placeholder="PHONE_NUMBER"
                  className="bg-black/50 border-primary/20 pl-10 text-primary font-code h-12 focus:ring-primary"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-primary/40" />
                <Input
                  type="password"
                  placeholder="SECURE_PASSWORD"
                  className="bg-black/50 border-primary/20 pl-10 text-primary font-code h-12 focus:ring-primary"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
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