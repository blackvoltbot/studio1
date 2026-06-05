'use client';

import React, { useState, useEffect } from 'react';
import { Search, History, Trash2, Copy, Fingerprint, Database, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { performLookup } from '@/app/lib/lookup-actions';

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
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('black_detail_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const saveToHistory = (record: SearchRecord) => {
    const updated = [record, ...history.filter(h => h.number !== record.number)].slice(0, 50);
    setHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('black_detail_history', JSON.stringify(updated));
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!number || number.length < 5) {
      toast({ variant: "destructive", title: "Invalid Target", description: "Please enter a valid mobile number." });
      return;
    }

    setIsSearching(true);
    setCurrentResult(null);

    const result = await performLookup(number);

    if (result.success) {
      const newRecord: SearchRecord = {
        id: crypto.randomUUID(),
        number,
        timestamp: Date.now(),
        data: result.data,
      };

      setCurrentResult(newRecord);
      saveToHistory(newRecord);
      toast({ title: "Lookup Successful", description: `Data retrieved for ${number}.` });
    } else {
      toast({ variant: "destructive", title: "Lookup Failed", description: result.error || "Connection error." });
    }

    setIsSearching(false);
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('black_detail_history');
    }
    toast({ title: "Logs Cleared", description: "Search history purged." });
  };

  const copyToClipboard = (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Data copied to clipboard." });
    }
  };

  // Ensure initial render matches server render
  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-card border-primary/20 red-glow-hover transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red">
              <Fingerprint className="w-5 h-5 text-primary" />
              MOBILE INTELLIGENCE SEARCH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="TARGET_PHONE_NUMBER"
                  className="bg-black/40 border-primary/30 text-primary font-code focus:border-primary pl-10"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-primary/60" />
              </div>
              <Button 
                type="submit" 
                disabled={isSearching}
                className="bg-primary hover:bg-primary/80 min-w-[140px] pulse-red transition-all"
              >
                {isSearching ? "SCANNING..." : "SEARCH"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-card border-primary/20 overflow-hidden">
                <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
                    <h3 className="text-sm font-headline tracking-widest text-primary flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        RETRIEVED DATA
                    </h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => copyToClipboard(JSON.stringify(currentResult.data, null, 2))}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <CardContent className="p-0">
                    <pre className="p-6 overflow-auto max-h-[500px] text-xs font-code text-primary/80 bg-black/40 scrollbar-thin scrollbar-thumb-primary/20">
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
            <CardTitle className="flex items-center gap-2 text-sm font-headline tracking-widest text-primary">
              <History className="w-4 h-4" />
              SEARCH HISTORY
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
                <p className="text-xs font-code uppercase tracking-tighter">No logs found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setCurrentResult(record)}
                    className={`w-full text-left p-3 rounded-md border transition-all flex items-center justify-between group ${
                      currentResult?.id === record.id 
                        ? 'bg-primary/10 border-primary/40' 
                        : 'bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-code ${currentResult?.id === record.id ? 'text-primary' : 'text-foreground/80'}`}>{record.number}</p>
                      <p className="text-[10px] text-muted-foreground font-code mt-0.5">
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
