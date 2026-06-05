'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Settings, Lock, LogOut, ShieldAlert, Save, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MatrixBackground } from '@/components/MatrixBackground';

export default function AdminDashboardPage() {
  const [newSitePassword, setNewSitePassword] = useState('');
  const [currentSitePassword, setCurrentSitePassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
      } else {
        const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
        if (settingsSnap.exists()) {
          setCurrentSitePassword(settingsSnap.data().websitePassword);
          setNewSitePassword(settingsSnap.data().websitePassword);
        }
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const updatePassword = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        websitePassword: newSitePassword
      });
      setCurrentSitePassword(newSitePassword);
      toast({ title: "Configuration Updated", description: "Global site password has been modified." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setIsSaving(false);
  };

  const triggerForceLogout = async () => {
    if (!confirm("Are you sure? This will immediately logout all current active user sessions.")) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        forceLogoutVersion: increment(1)
      });
      toast({ title: "Operation Successful", description: "Global session termination signal sent." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <MatrixBackground />
      <div className="scanline opacity-10"></div>
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-md p-6 rounded-xl border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-xl border border-primary/40">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-headline tracking-tighter text-glow-red">CORE SETTINGS</h1>
              <p className="text-xs text-muted-foreground font-code uppercase tracking-widest">Global Administrative Override</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary/20 hover:bg-primary/10 text-primary font-code">
            <LogOut className="w-4 h-4 mr-2" /> EXIT
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary font-headline tracking-widest">
                <Lock className="w-5 h-5" /> SITE ACCESS KEY
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change the global password required to enter the website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-code text-muted-foreground uppercase tracking-widest">New Security Cipher</label>
                <Input
                  className="bg-black/50 border-primary/20 text-primary font-code"
                  value={newSitePassword}
                  onChange={(e) => setNewSitePassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={updatePassword} 
                disabled={isSaving || newSitePassword === currentSitePassword}
                className="w-full bg-primary hover:bg-primary/80 font-bold"
              >
                <Save className="w-4 h-4 mr-2" /> COMMIT CHANGES
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-destructive/20 border-l-4 border-l-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive font-headline tracking-widest">
                <ShieldAlert className="w-5 h-5" /> FORCE LOGOUT
              </CardTitle>
              <CardDescription className="text-muted-foreground">Terminate all active user sessions across all devices globally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/5 rounded border border-destructive/10">
                <p className="text-xs text-destructive/80 font-code italic">Warning: This action is immediate and cannot be reversed. Users will be redirected to the lock screen.</p>
              </div>
              <Button 
                variant="destructive"
                onClick={triggerForceLogout} 
                disabled={isSaving}
                className="w-full bg-destructive hover:bg-destructive/80 font-bold pulse-red"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} /> TRIGGER GLOBAL LOGOUT
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/5">
            <h3 className="text-xs font-headline text-muted-foreground/60 tracking-[0.2em] mb-4">SYSTEM STATUS LOGS</h3>
            <div className="space-y-2 font-code text-[10px] uppercase">
                <p className="text-emerald-500/60">[ OK ] FIREBASE CONNECTION ESTABLISHED</p>
                <p className="text-emerald-500/60">[ OK ] GENKIT FLOWS INITIALIZED</p>
                <p className="text-emerald-500/60">[ OK ] CLOUD FIRESTORE SYNCHRONIZED</p>
                <p className="text-primary/60">[ !! ] ADMINISTRATIVE ACCESS GRANTED FROM {new Date().toLocaleDateString()}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
