'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, History, Trash2, Fingerprint, Database, FileText, CheckCircle2, Clock, XCircle, QrCode, AlertCircle } from 'lucide-react';
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
  
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
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
    return doc(db, 'requests', activeRequestId);
  }, [db, activeRequestId]);

  const { data: requestData, loading: requestLoading } = useDoc(requestRef);

  // Access Logic
  const isApproved = requestData?.status === 'approved';
  const isUsed = requestData?.used === true;
  const canSearch = isApproved && !isUsed;

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch) {
      toast({ variant: "destructive", title: "Access Locked", description: "Authorization required." });
      return;
    }
    if (!number || number.length < 5) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Enter valid target ID." });
      return;
    }

    setIsSearching(true);
    try {
      const result = await performLookup(number, activeRequestId!);

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

        // Clear session after successful use
        setActiveRequestId(null);
        localStorage.removeItem('bd_active_request');

        toast({ title: "Scan Complete", description: "Authorization used." });
      } else {
        toast({ variant: "destructive", title: "Scan Failed", description: result.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('black_detail_history');
    toast({ title: "Logs Cleared" });
  };

  if (!mounted) return null;

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
              ACCESS_INTERFACE
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
            </div>

            <div className="text-center space-y-1">
              <p className="text-xl font-bold tracking-widest text-primary uppercase">Scan to Pay ₹5</p>
              <p className="text-[10px] text-muted-foreground font-code uppercase tracking-[0.3em]">SECURE_UPI_GATEWAY</p>
            </div>

            <div className="w-full max-w-sm space-y-4">
              <Button 
                onClick={() => console.log("PAY CLICKED")}
                className="w-full bg-primary hover:bg-primary/80 font-bold tracking-widest h-12 shadow-[0_0_20px_rgba(255,0,0,0.2)] pulse-red"
              >
                Pay & Unlock
              </Button>

              {activeRequestId && requestData?.status === 'pending' && (
                <div className="flex flex-col items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg w-full">
                  <Clock className="w-6 h-6 text-primary animate-pulse" />
                  <p className="text-sm font-headline tracking-widest text-primary uppercase font-bold text-center">Awaiting Approval</p>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] text-muted-foreground font-code uppercase">Tracking ID: {activeRequestId}</p>
                    <p className="text-[9px] text-muted-foreground/60 font-code uppercase animate-pulse">Synchronizing with Admin Core...</p>
                  </div>
                </div>
              )}

              {canSearch && (
                <div className="flex flex-col items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg w-full">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <p className="text-sm font-headline tracking-widest text-emerald-500 uppercase font-bold text-center">Authorization Granted</p>
                  <p className="text-[10px] text-muted-foreground font-code uppercase">Scanner Ready</p>
                </div>
              )}

              {requestData?.status === 'declined' && (
                <div className="flex flex-col items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg w-full">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <p className="text-sm font-headline tracking-widest text-destructive uppercase font-bold text-center">Access Denied</p>
                  <p className="text-[10px] text-muted-foreground font-code uppercase text-center">Verify payment and try again</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`glass-card border-primary/20 transition-all ${!canSearch ? 'opacity-40 grayscale pointer-events-none' : 'red-glow-hover'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red uppercase">
              <Fingerprint className="w-5 h-5 text-primary" />
              INTEL_SCANNER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="ENTER TARGET NUMBER"
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
                className="bg-primary hover:bg-primary/80 min-w-[140px] h-12 font-bold uppercase tracking-widest"
              >
                {isSearching ? "SCANNING..." : "SEARCH"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentResult && (
          <Card className="glass-card border-primary/20 overflow-hidden animate-in fade-in">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-sm font-headline tracking-widest text-primary uppercase">SCAN_OUTPUT</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-6 overflow-auto max-h-[500px] text-xs font-code text-primary/80 bg-black/40 leading-relaxed">
                {JSON.stringify(currentResult.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="glass-card border-primary/20 h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-headline tracking-widest text-primary uppercase">
              <History className="w-4 h-4" />
              OP_LOGS
            </CardTitle>
            {history.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={clearHistory}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[600px] px-2">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                <FileText className="w-12 h-12 mb-2" />
                <p className="text-xs font-code uppercase">No Logs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setCurrentResult(record)}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      currentResult?.id === record.id 
                        ? 'bg-primary/10 border-primary/40' 
                        : 'bg-white/5 border-white/10 hover:border-primary/30'
                    }`}
                  >
                    <p className={`text-sm font-code ${currentResult?.id === record.id ? 'text-primary' : 'text-foreground/80'}`}>{record.number}</p>
                    <p className="text-[10px] text-muted-foreground font-code uppercase">{new Date(record.timestamp).toLocaleTimeString()}</p>
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
