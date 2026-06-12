'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  History, 
  Trash2, 
  Fingerprint, 
  Database, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  QrCode, 
  Coins, 
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { performLookupWithDeduction, requestCoinPackage } from '@/app/lib/lookup-actions';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc } from '@/firebase';

interface SearchRecord {
  id: string;
  number: string;
  timestamp: number;
  data: any;
}

const COIN_PACKAGES = [
  { amount: 50, coins: 20, label: "Starter" },
  { amount: 100, coins: 45, label: "Standard" },
  { amount: 500, coins: 300, label: "Pro" },
  { amount: 1000, coins: 900, label: "Enterprise" }
];

export const IntelligenceCenter: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [number, setNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<SearchRecord | null>(null);
  const [isRequesting, setIsRequesting] = useState<number | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
    const phone = localStorage.getItem('bd_user_phone');
    if (phone) setUserPhone(phone);

    const saved = localStorage.getItem('black_detail_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const userRef = useMemo(() => {
    if (!db || !userPhone) return null;
    return doc(db, 'users', userPhone);
  }, [db, userPhone]);

  const { data: userData, loading: userLoading } = useDoc(userRef);

  const currentCoins = userData?.coins || 0;
  const canSearch = currentCoins >= 5;

  const handlePurchase = async (pkg: typeof COIN_PACKAGES[0]) => {
    if (!userPhone) return;
    setIsRequesting(pkg.amount);
    try {
      const res = await requestCoinPackage(userPhone, pkg);
      if (res.success) {
        toast({ 
          title: "Request Transmitted", 
          description: `Transaction ID ${res.transactionId} pending admin approval.` 
        });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Link Failure", description: "Transmission failed." });
    } finally {
      setIsRequesting(null);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userPhone) return;
    if (!canSearch) {
      toast({ variant: "destructive", title: "Insufficient Coins", description: "At least 5 coins required for scan." });
      return;
    }
    if (!number || number.length < 5) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Enter valid target ID." });
      return;
    }

    setIsSearching(true);
    try {
      const result = await performLookupWithDeduction(userPhone, number);

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

        toast({ title: "Scan Complete", description: "5 Coins deducted from terminal." });
      } else {
        toast({ variant: "destructive", title: "Scan Failed", description: result.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operational Error", description: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('black_detail_history');
    toast({ title: "Operation Logs Purged" });
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        
        {/* Coin Balance & Wallet */}
        <Card className="glass-card border-primary/20 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red uppercase">
              <Coins className="w-5 h-5 text-primary" />
              TERMINAL_WALLET
            </CardTitle>
            <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <p className="text-2xl font-bold font-code text-primary">{currentCoins}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-code">Credits</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {COIN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  disabled={isRequesting !== null}
                  onClick={() => handlePurchase(pkg)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all group disabled:opacity-50"
                >
                  <p className="text-[10px] text-muted-foreground uppercase font-code group-hover:text-primary">{pkg.label}</p>
                  <p className="text-xl font-bold text-foreground">₹{pkg.amount}</p>
                  <p className="text-[10px] text-primary font-bold uppercase">{pkg.coins} Coins</p>
                  <CreditCard className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors mt-1" />
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-2xl border border-primary/10 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <QrCode className="w-16 h-16 text-primary" />
              </div>
              <img 
                src="https://i.ibb.co/W4ZwkjYy/f1421dab-de96-46fe-bbb9-c66202f3fe1e.jpg"
                alt="Payment QR"
                width="150"
                height="150"
                className="rounded-lg shadow-2xl mb-4 border-2 border-primary/20"
                data-ai-hint="payment qr"
              />
              <p className="text-[10px] text-muted-foreground font-code uppercase tracking-[0.3em] text-center">
                Scan & Select Package Above
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Intel Scanner */}
        <Card className={`glass-card border-primary/20 transition-all ${!canSearch ? 'opacity-50 grayscale' : 'red-glow-hover'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red uppercase">
                <Fingerprint className="w-5 h-5 text-primary" />
                INTEL_SCANNER
              </CardTitle>
              {!canSearch && (
                <div className="flex items-center gap-2 text-destructive text-[10px] font-code uppercase animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  RELOAD_REQUIRED
                </div>
              )}
            </div>
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
                {isSearching ? "SCANNING..." : "SEARCH [5C]"}
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
                <p className="text-xs font-code uppercase">Empty Logs</p>
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