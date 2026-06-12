'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { doc, getDoc, updateDoc, increment, collection, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Settings, Lock, LogOut, ShieldAlert, Save, RefreshCw, Cpu, Database, CheckCircle2, XCircle, Clock, History, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MatrixBackground } from '@/components/MatrixBackground';

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [newSitePassword, setNewSitePassword] = useState('');
  const [currentSitePassword, setCurrentSitePassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !auth || !db) return;

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
  }, [router, auth, db, mounted]);

  // Payment Requests Query
  const requestsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'payment_requests'), orderBy('timestamp', 'desc'), limit(20));
  }, [db]);

  const { data: requests, loading: requestsLoading } = useCollection(requestsQuery);

  const updatePassword = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        websitePassword: newSitePassword
      });
      setCurrentSitePassword(newSitePassword);
      toast({ title: "Success", description: "Global cipher updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setIsSaving(false);
  };

  const handleRequestStatus = async (requestId: string, status: 'APPROVED' | 'DECLINED') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'payment_requests', requestId), { status });
      toast({ title: "Status Updated", description: `Request ${status.toLowerCase()} successfully.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const triggerForceLogout = async () => {
    if (!db) return;
    if (!confirm("Confirm global session termination?")) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        forceLogoutVersion: increment(1)
      });
      toast({ title: "Executed", description: "All sessions invalidated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setIsSaving(false);
  };

  const setTelegramWebhook = async () => {
    const host = window.location.host;
    const botToken = '8902869302:AAHbJcwNtwaQCubsGyrVcDQj1QCKEtzLnMg';
    const webhookUrl = `https://${host}/api/telegram-webhook`;
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Webhook Registered", description: "Telegram bot is now connected to this endpoint." });
      } else {
        toast({ variant: "destructive", title: "Webhook Failed", description: data.description });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Network Error", description: e.message });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/admin/login');
  };

  if (!mounted || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Cpu className="w-8 h-8 text-primary animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <MatrixBackground />
      <div className="scanline opacity-10"></div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-md p-6 rounded-xl border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-xl border border-primary/40">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-headline tracking-tighter text-glow-red uppercase">Black Detail Terminal</h1>
              <p className="text-xs text-muted-foreground font-code uppercase tracking-widest">Administrative Override Unit</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary/20 hover:bg-primary/10 text-primary font-code">
            <LogOut className="w-4 h-4 mr-2" /> EXIT
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass-card border-primary/20">
              <CardHeader className="border-b border-primary/10 mb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary font-headline tracking-widest uppercase">
                    <Database className="w-5 h-5" /> PAYMENT APPROVAL TERMINAL
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs uppercase font-code">Authorization override queue</CardDescription>
                </div>
                <Button onClick={setTelegramWebhook} size="sm" variant="outline" className="text-[10px] h-7 border-primary/20 hover:bg-primary/10">
                  <Globe className="w-3 h-3 mr-1" /> SYNC WEBHOOK
                </Button>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="py-12 text-center animate-pulse">
                    <Cpu className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-[10px] font-code uppercase text-primary/60">Scanning Data Channels...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-12 text-center opacity-30">
                    <History className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-[10px] font-code uppercase">No pending requests detected</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                    {requests.map((req: any) => (
                      <div key={req.requestId} className="bg-black/40 border border-primary/10 p-4 rounded-lg flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-code text-muted-foreground uppercase">ID:</span>
                            <span className="text-xs font-code text-primary">{req.requestId.slice(0, 12)}...</span>
                            <span className={`text-[10px] font-code px-1.5 py-0.5 rounded border ${
                              req.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                              req.status === 'WAITING_APPROVAL' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                              req.status === 'USED' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                              'bg-destructive/10 border-destructive/20 text-destructive'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-code">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.timestamp).toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> ₹{req.amount}</span>
                          </div>
                        </div>
                        
                        {req.status === 'WAITING_APPROVAL' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-500 h-8 font-bold text-[10px]"
                              onClick={() => handleRequestStatus(req.requestId, 'APPROVED')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> APPROVE
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 font-bold text-[10px]"
                              onClick={() => handleRequestStatus(req.requestId, 'DECLINED')}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> DECLINE
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-primary font-headline tracking-widest">
                  <Lock className="w-5 h-5" /> ACCESS CIPHER
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs uppercase font-code">Modify global operational key.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
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
                  <Save className="w-4 h-4 mr-2" /> COMMIT
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-destructive/20 border-l-4 border-l-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-destructive font-headline tracking-widest">
                  <ShieldAlert className="w-5 h-5" /> FORCE PURGE
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs uppercase font-code">Terminate all global sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive"
                  onClick={triggerForceLogout} 
                  disabled={isSaving}
                  className="w-full bg-destructive hover:bg-destructive/80 font-bold pulse-red"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} /> TRIGGER LOGOUT
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
