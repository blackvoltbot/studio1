'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, History, Trash2, Copy, Fingerprint, Database, FileText, CheckCircle2, Clock, XCircle, QrCode, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { performLookup, createPaymentRequest } from '@/app/lib/lookup-actions';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc } from '@/firebase';

interface SearchRecord {
  id: string;
  number: string;
  timestamp: number;
  data: any;
}

export const IntelligenceCenter: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [number, setNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<SearchRecord | null>(null);
  
  const [sessionId, setSessionId] = useState('');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
    
    let sId = localStorage.getItem('bd_session_id');
    if (!sId) {
      sId = Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem('bd_session_id', sId);
    }
    setSessionId(sId);

    const lastReq = localStorage.getItem('bd_active_request');
    if (lastReq) setActiveRequestId(lastReq);

    const saved = localStorage.getItem('black_detail_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const requestRef = useMemo(() => {
    if (!db || !activeRequestId) return null;
    return doc(db, 'payment_requests', activeRequestId);
  }, [db, activeRequestId]);

  const { data: requestData, loading: requestLoading } = useDoc(requestRef);

  const canSearch = requestData?.status === 'APPROVED';

  useEffect(() => {
    if (!requestData) return;

    if (requestData.status === 'APPROVED') {
      toast({
        title: "AUTHORIZATION GRANTED",
        description: "Core access enabled. Proceed with intelligence scan.",
      });
    } else if (requestData.status === 'DECLINED') {
      toast({
        variant: "destructive",
        title: "ACCESS DENIED",
        description: "Administrative override declined authorization.",
      });
    }
  }, [requestData?.status, toast]);

  const handlePaidClick = async () => {
    setIsPaying(true);
    try {
      // Generate a clean, readable ID
      const newRequestId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const host = typeof window !== 'undefined' ? window.location.host : '';
      await createPaymentRequest(newRequestId, sessionId, host);
      
      setActiveRequestId(newRequestId);
      localStorage.setItem('bd_active_request', newRequestId);
      
      toast({
        title: "Request Transmitted",
        description: "Admin terminal notified. Awaiting security core approval."
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Transmission Error",
        description: e.message
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch || !activeRequestId) {
      toast({ variant: "destructive", title: "Access Locked", description: "Authorization sequence required." });
      return;
    }
    if (!number || number.length < 5) {
      toast({ variant: "destructive", title: "Invalid Scan Target", description: "Enter a valid mobile identifier." });
      return;
    }

    setIsSearching(true);
    setCurrentResult(null);

    try {
      const result = await performLookup(number, activeRequestId);

      if (result.success) {
        const newRecord: SearchRecord = {
          id: Math.random().toString(36).substring(2, 12),
          number,
          timestamp: Date.now(),
          data: result.data,
        };

        setCurrentResult(newRecord);
        
        setHistory(prev => {
          const updated = [newRecord, ...prev.filter(h => h.number !== newRecord.number)].slice(0, 50);
          localStorage.setItem('black_detail_history', JSON.stringify(updated));
          return updated;
        });

        // Clear request immediately after success
        setActiveRequestId(null);
        localStorage.removeItem('bd_active_request');

        toast({ 
          title: "Scan Complete", 
          description: "Intelligence retrieved. Authorization invalidated." 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Link Timeout", 
          description: result.error || "Operational failure in intelligence link." 
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "System Error", description: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('black_detail_history');
    toast({ title: "Operational Logs Cleared" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Buffer" });
  };

  if (!mounted) return null;

  // Show "I've Paid" if we are not currently approved
  const showPaidButton = !canSearch;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        
        <Card className="glass-card border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <QrCode className="w-24 h-24 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red uppercase">
              <Database className="w-5 h-5 text-primary" />
              ACCESS CONTROL INTERFACE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            
            <div className="relative group p-2 bg-white rounded-xl">
              <img 
                src="https://i.ibb.co/W4ZwkjYy/f1421dab-de96-46fe-bbb9-c66202f3fe1e.jpg"
                alt="Payment QR"
                width="200"
                height="200"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute inset-0 border-2 border-primary/20 rounded-xl group-hover:border-primary/50 transition-all"></div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xl font-bold tracking-widest text-primary uppercase">Pay ₹5 To Search</p>
              <p className="text-[10px] text-muted-foreground font-code uppercase tracking-[0.3em]">UPI IDENTITY VERIFICATION REQUIRED</p>
            </div>

            <div className="w-full max-w-sm space-y-4">
              {showPaidButton && (
                <Button 
                  onClick={handlePaidClick}
                  disabled={isPaying}
                  className="w-full bg-primary hover:bg-primary/80 font-bold tracking-widest h-12 shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                >
                  {isPaying ? "INITIALIZING..." : "✅ I'VE PAID"}
                </Button>
              )}

              {activeRequestId && requestData?.status === 'WAITING_APPROVAL' && (
                <div className="flex flex-col items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <Clock className="w-6 h-6 text-primary animate-pulse" />
                  <p className="text-sm font-headline tracking-widest text-primary uppercase font-bold text-center">Waiting For Admin Approval</p>
                  <p className="text-[10px] text-muted-foreground font-code uppercase">Req ID: {activeRequestId}</p>
                </div>
              )}

              {requestData?.status === 'APPROVED' && (
                <div className="flex flex-col items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <p className="text-sm font-headline tracking-widest text-emerald-500 uppercase font-bold text-center">Approved</p>
                  <p className="text-[10px] text-emerald-500/60 font-code uppercase">Terminal Unlocked. Payment Approved. You may now search.</p>
                </div>
              )}

              {requestData?.status === 'DECLINED' && (
                <div className="flex flex-col items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <p className="text-sm font-headline tracking-widest text-destructive uppercase font-bold text-center">Declined</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`glass-card border-primary/20 transition-all ${!canSearch ? 'opacity-40 grayscale pointer-events-none' : 'red-glow-hover shadow-[0_0_20px_rgba(255,0,0,0.1)]'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red uppercase">
              <Fingerprint className="w-5 h-5 text-primary" />
              MOBILE INTELLIGENCE SCANNER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="TARGET_IDENTIFIER"
                  className="bg-black/40 border-primary/30 text-primary font-code focus:border-primary pl-10 h-12"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={!canSearch || isSearching}
                />
                <Search className="absolute left-3 top-4 w-4 h-4 text-primary/60" />
              </div>
              <Button 
                type="submit" 
                disabled={!canSearch || isSearching}
                className={`bg-primary hover:bg-primary/80 min-w-[140px] transition-all h-12 font-bold uppercase tracking-widest ${canSearch ? 'pulse-red shadow-[0_0_15px_rgba(255,0,0,0.3)]' : ''}`}
              >
                {isSearching ? "SCANNING..." : "ENGAGE SEARCH"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-card border-primary/20 overflow-hidden">
                <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
                    <h3 className="text-sm font-headline tracking-widest text-primary flex items-center gap-2 uppercase">
                        <Database className="w-4 h-4" />
                        RETRIEVED DATA CORE
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:bg-primary/10" 
                      onClick={() => copyToClipboard(JSON.stringify(currentResult.data, null, 2))}
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <CardContent className="p-0">
                    <pre className="p-6 overflow-auto max-h-[500px] text-xs font-code text-primary/80 bg-black/40 scrollbar-thin scrollbar-thumb-primary/20 leading-relaxed">
                        {JSON.stringify(currentResult.data, null, 2)}
                    </pre>
                </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card className="glass-card border-primary/20 h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-headline tracking-widest text-primary uppercase">
              <History className="w-4 h-4" />
              OPERATIONAL LOGS
            </CardTitle>
            {history.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary" 
                onClick={clearHistory}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[600px] px-2 scrollbar-thin scrollbar-thumb-primary/20">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                <FileText className="w-12 h-12 mb-2" />
                <p className="text-xs font-code uppercase tracking-widest">No Active Logs Detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setCurrentResult(record)}
                    className={`w-full text-left p-3 rounded-md border transition-all flex items-center justify-between group ${
                      currentResult?.id === record.id 
                        ? 'bg-primary/10 border-primary/40 shadow-[0_0_10px_rgba(255,0,0,0.1)]' 
                        : 'bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-code ${currentResult?.id === record.id ? 'text-primary' : 'text-foreground/80'}`}>{record.number}</p>
                      <p className="text-[10px] text-muted-foreground font-code mt-0.5 uppercase tracking-widest">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
