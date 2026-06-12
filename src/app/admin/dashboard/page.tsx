'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Settings, 
  Database, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Clock, 
  User, 
  Lock,
  RefreshCw,
  Loader2,
  Coins,
  ArrowUpCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { approveTransaction, declineTransaction, removeTransaction, updateSystemConfig, adjustUserCoins } from '@/app/lib/lookup-actions';

/**
 * Inline control for adjusting a user's balance directly from the table.
 */
const UserBalanceControl = ({ phone }: { phone: string }) => {
  const db = useFirestore();
  const userRef = useMemo(() => {
    if (!db || !phone) return null;
    return doc(db, 'users', phone);
  }, [db, phone]);

  const { data: userData } = useDoc(userRef);

  const handleAdjust = async (amt: number) => {
    await adjustUserCoins(phone, amt);
  };

  return (
    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/5">
      <div className="flex flex-col">
        <span className="text-[8px] text-muted-foreground uppercase leading-none mb-0.5">Balance</span>
        <span className="text-[11px] font-bold text-white tabular-nums">{userData?.coins || 0}</span>
      </div>
      <div className="flex gap-1 ml-1">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500"
          onClick={() => handleAdjust(10)}
          title="Add 10 Coins"
        >
          <Plus className="w-3 h-3" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive"
          onClick={() => handleAdjust(-10)}
          title="Subtract 10 Coins"
        >
          <Minus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  const [newAdminPass, setNewAdminPass] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const configRef = useMemo(() => db ? doc(db, 'config', 'system') : null, [db]);
  const { data: config, loading: configLoading } = useDoc(configRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !configLoading && config) {
      const storedToken = localStorage.getItem('admin_auth_token');
      if (!storedToken || storedToken.trim() !== config.adminPassword?.trim()) {
        router.push('/admin/login');
      }
    }
  }, [mounted, config, configLoading, router]);

  const txQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: transactions, loading: txLoading } = useCollection(txQuery);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    router.push('/admin/login');
  };

  const onApprove = async (id: string) => {
    const res = await approveTransaction(id);
    if (res.success) toast({ title: "Approved", description: "Coins credited to user." });
  };

  const onDecline = async (id: string) => {
    const res = await declineTransaction(id);
    if (res.success) toast({ title: "Declined", description: "Transaction marked as declined." });
  };

  const onDelete = async (id: string) => {
    const res = await removeTransaction(id);
    if (res.success) toast({ title: "Deleted", description: "Record removed." });
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass) return;
    setIsUpdating(true);
    try {
      await updateSystemConfig({ adminPassword: newAdminPass });
      toast({ title: "Updated", description: "Admin passcode modified." });
      localStorage.setItem('admin_auth_token', newAdminPass);
      setNewAdminPass('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!mounted || !db) return null;

  if (configLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-code text-primary uppercase tracking-[0.5em]">Syncing Admin Core...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-body">
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tighter text-glow-red uppercase font-headline">ADMIN_CORE</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-primary gap-2">
            <LogOut className="w-4 h-4" />
            EXIT
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="transactions" className="gap-2 uppercase font-code text-xs">
              <Coins className="w-3 h-3" />
              Coin Requests
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 uppercase font-code text-xs">
              <Settings className="w-3 h-3" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-white/5">
                <CardHeader className="py-4">
                  <CardTitle className="text-xs font-code text-muted-foreground uppercase flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Live Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold font-headline">{transactions?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total TX</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-headline text-primary">
                      {transactions?.filter(t => t.status === 'pending').length || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase font-code text-muted-foreground bg-white/5">
                    <tr>
                      <th className="px-6 py-4">TX ID</th>
                      <th className="px-6 py-4">User Phone</th>
                      <th className="px-6 py-4">Package</th>
                      <th className="px-6 py-4">Coins / Balance Control</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {txLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-code">SYNCING_TRANSACTIONS...</td>
                      </tr>
                    ) : transactions?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-code">NO_REQUESTS_FOUND</td>
                      </tr>
                    ) : transactions?.map((tx) => (
                      <tr key={tx.transactionId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-code text-xs text-primary">{tx.transactionId}</td>
                        <td className="px-6 py-4 font-code text-xs">{tx.userPhone}</td>
                        <td className="px-6 py-4 font-code text-xs text-muted-foreground uppercase">₹{tx.amount}</td>
                        <td className="px-6 py-4 font-code text-xs">
                          <div className="flex items-center gap-4">
                            <span className="text-primary font-bold">{tx.coins} C</span>
                            <div className="h-6 w-[1px] bg-white/10" />
                            <UserBalanceControl phone={tx.userPhone} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            tx.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' :
                            tx.status === 'declined' ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                            'bg-primary/10 border-primary/50 text-primary animate-pulse'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {tx.status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => onApprove(tx.transactionId)} className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => onDecline(tx.transactionId)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => onDelete(tx.transactionId)} className="h-8 w-8 text-muted-foreground hover:text-white">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="max-w-2xl">
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline tracking-widest uppercase flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateConfig} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-code uppercase text-muted-foreground">Admin Access Token</label>
                    <Input 
                      type="password" 
                      placeholder="NEW_ADMIN_PASSCODE" 
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="bg-black/50 border-white/10 text-primary font-code"
                    />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" disabled={isUpdating} className="w-full bg-primary font-bold uppercase tracking-widest h-12">
                      {isUpdating ? "SYNCHRONIZING..." : "COMMIT_CHANGES"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
