'use client';

import React, { useState, useEffect } from 'react';
import { Search, History, Trash2, Copy, AlertTriangle, Fingerprint, ShieldCheck, Database, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { performLookup } from '@/app/lib/lookup-actions';
import { aiResultAnalysis, AiResultAnalysisOutput } from '@/ai/flows/ai-result-analysis';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface SearchRecord {
  id: string;
  number: string;
  timestamp: number;
  data: any;
  aiAnalysis?: AiResultAnalysisOutput;
}

export const IntelligenceCenter: React.FC = () => {
  const [number, setNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<SearchRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('number_intel_history');
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
    localStorage.setItem('number_intel_history', JSON.stringify(updated));
  };

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!number || number.length < 5) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid target number." });
      return;
    }

    setIsSearching(true);
    setCurrentResult(null);

    const result = await performLookup(number);

    if (result.success) {
      const rawData = JSON.stringify(result.data);
      
      let aiAnalysis: AiResultAnalysisOutput | undefined;
      try {
        aiAnalysis = await aiResultAnalysis({ rawData });
      } catch (error) {
        console.error("AI Analysis Failed", error);
      }

      const newRecord: SearchRecord = {
        id: crypto.randomUUID(),
        number,
        timestamp: Date.now(),
        data: result.data,
        aiAnalysis
      };

      setCurrentResult(newRecord);
      saveToHistory(newRecord);
      toast({ title: "Analysis Complete", description: `Intelligence gathered for ${number}.` });
    } else {
      toast({ variant: "destructive", title: "Infiltration Failed", description: result.error || "Could not reach target database." });
    }

    setIsSearching(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('number_intel_history');
    toast({ title: "Logs Purged", description: "Search history has been permanently deleted." });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Information copied to internal clipboard." });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Search & Tool Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-card border-primary/20 red-glow-hover transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-headline tracking-widest text-glow-red">
              <Fingerprint className="w-5 h-5 text-primary" />
              INTEL SEARCH ENGINE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="TARGET_PHONE_NUMBER (e.g. +123456789)"
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
                {isSearching ? "SEARCHING..." : "ANALYZE TARGET"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Summary Card */}
            {currentResult.aiAnalysis && (
              <Card className="glass-card border-secondary/40 border-l-4 border-l-secondary shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-secondary font-headline tracking-widest text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      AI INTEL REPORT
                    </CardTitle>
                    <Badge variant="outline" className={`font-code text-[10px] ${
                        currentResult.aiAnalysis.threatAssessment.toLowerCase().includes('high') || currentResult.aiAnalysis.threatAssessment.toLowerCase().includes('critical')
                        ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'
                    }`}>
                      {currentResult.aiAnalysis.category.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-[10px] uppercase text-muted-foreground font-code tracking-widest mb-1">Summary</h4>
                    <p className="text-sm text-foreground/90 font-body leading-relaxed">{currentResult.aiAnalysis.summary}</p>
                  </div>
                  <div className="p-3 bg-secondary/5 rounded border border-secondary/10">
                    <h4 className="text-[10px] uppercase text-secondary font-code tracking-widest mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Threat Assessment
                    </h4>
                    <p className="text-sm text-foreground/80 font-body italic">{currentResult.aiAnalysis.threatAssessment}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Data Card */}
            <Card className="glass-card border-primary/20 overflow-hidden">
                <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
                    <h3 className="text-sm font-headline tracking-widest text-primary flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        RAW INTEL DATA
                    </h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => copyToClipboard(JSON.stringify(currentResult.data, null, 2))}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <CardContent className="p-0">
                    <pre className="p-6 overflow-auto max-h-[400px] text-xs font-code text-primary/80 bg-black/40 scrollbar-thin scrollbar-thumb-primary/20">
                        {JSON.stringify(currentResult.data, null, 2)}
                    </pre>
                </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="space-y-6">
        <Card className="glass-card border-primary/20 h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-headline tracking-widest text-primary">
              <History className="w-4 h-4" />
              SESSION LOGS
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
                <p className="text-xs font-code uppercase tracking-tighter">No intelligence logs found</p>
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
                    {record.aiAnalysis && (
                      <Badge variant="outline" className={`text-[8px] h-4 px-1 ${
                        record.aiAnalysis.category === 'Spam' || record.aiAnalysis.category === 'Scam' ? 'border-red-500 text-red-500' : 'border-emerald-500 text-emerald-500'
                      }`}>
                        {record.aiAnalysis.category}
                      </Badge>
                    )}
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
