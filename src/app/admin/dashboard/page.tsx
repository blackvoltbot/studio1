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
  Minus,
  Check,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  approveTransaction, 
  declineTransaction, 
  removeTransaction, 
  updateSystemConfig, 
  adjustUserCoins, 
  setUserCoins,
  addNewPackage,
  updatePackage,
  deletePackage
} from '@/app/lib/lookup-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

const UserBalanceControl = ({ phone }: { phone: string }) => {
  const db = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  
  const userRef = useMemo(() => {
    if (!db || !phone) return null;
    return doc(db, 'users', phone);
  }, [db, phone]);

  const { data: userData } = useDoc(userRef);

  const handleAdjust = async (amt: number) => {
    await adjustUserCoins(phone, amt);
  };

  const handleManualSave = async () => {
    const num = parseInt(editValue);
    if (!isNaN(num)) {
      await setUserCoins(phone, num);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/5">
      <div className="flex flex-col min-w-[50px]">
        <span className="text-[8px] text-muted-foreground uppercase leading-none mb-0.5">Balance</span>
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
              <input
                type="number"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSave()}
                className="w-12 h-5 bg-black border border-primary/50 text-[10px] text-primary font-bold px-1 rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-5 w-5 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/20"
                onClick={handleManualSave}
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span 
              onClick={() => {
                setEditValue(String(userData?.coins || 0));
                setIsEditing(true);
              }}
              className="text-[11px] font-bold text-white tabular-nums cursor-pointer hover:text-primary transition-colors underline decoration-white/10 underline-offset-2"
            >
              {userData?.coins || 0}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 ml-1 pl-2 border-l border-white/10">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500"
          onClick={() => handleAdjust(10)}
        >
          <Plus className="w-3 h-3" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive"
          onClick={() => handleAdjust(-10)}
        >
          <Minus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

const PackageEditorRow = ({ pkg }: { pkg: any }) => {
  const { toast } = useToast();
  const [priceInput, setPriceInput] = useState(String(pkg.amount));
  const [creditsInput, setCreditsInput] = useState(String(pkg.coins));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setPriceInput(String(pkg.amount));
    setCreditsInput(String(pkg.coins));
  }, [pkg]);

  const handleSave = async () => {
    const parsedPrice = parseInt(priceInput);
    const parsedCredits = parseInt(creditsInput);
    if (isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedCredits) || parsedCredits <= 0) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Positive numbers required." });
      return;
    }

    setIsSaving(true);
    const res = await updatePackage(pkg.id, { amount: parsedPrice, coins: parsedCredits });
    if (res.success) {
      toast({ title: "Updated", description: "Package configuration saved." });
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deletePackage(pkg.id);
    if (res.success) {
      toast({ title: "Deleted", description: "Package removed successfully." });
    }
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-lg gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white uppercase font-headline">{pkg.name}</span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card border-destructive/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive uppercase font-headline">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-code text-xs">
                Are you sure you want to delete the "{pkg.name}" package? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">NO, CANCEL</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80 font-bold">YES, DELETE</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-code uppercase w-12">Price:</span>
          <Input 
            type="number" 
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="flex-1 bg-black/50 border-white/10 text-primary font-code text-center h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-code uppercase w-12">Credits:</span>
          <Input 
            type="number" 
            value={creditsInput}
            onChange={(e) => setCreditsInput(e.target.value)}
            className="flex-1 bg-black/50 border-white/10 text-primary font-code text-center h-9"
          />
        </div>
      </div>
      <Button 
        size="sm" 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full bg-primary hover:bg-primary/80 font-bold uppercase text-xs h-9 tracking-wider"
      >
        {isSaving ? "SAVING..." : "SAVE CHANGES"}
      </Button>
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
  
  // Add Package State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCoins, setAddCoins] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const configRef = useMemo(() => db ? doc(db, 'config', 'system') : null, [db]);
  const { data: config, loading: configLoading } = useDoc(configRef);

  const txQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: transactions, loading: txLoading } = useCollection(txQuery);

  const pkgQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'packages'), orderBy('createdAt', 'asc'));
  }, [db]);
  const { data: packages, loading: pkgLoading } = useCollection(pkgQuery);

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

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    router.push('/admin/login');
  };

  const handleAddPackage = async () => {
    const price = parseInt(addPrice);
    const coins = parseInt(addCoins);
    if (!addName || isNaN(price) || price <= 0 || isNaN(coins) || coins <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "All fields required. Positive numbers only." });
      return;
    }

    setIsAdding(true);
    const res = await addNewPackage({ name: addName, amount: price, coins: coins });
    if (res.success) {
      toast({ title: "Success", description: "New package added to system." });
      setIsAddDialogOpen(false);
      setAddName('');
      setAddPrice('');
      setAddCoins('');
    }
    setIsAdding(false);
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
              <Coins className="w-3 h-3" /> Coin Requests
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 uppercase font-code text-xs">
              <Settings className="w-3 h-3" /> Configuration
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
                      <th className="px-6 py-4">Amount</th>
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
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-code text-xs text-primary">{tx.transactionId}</td>
                        <td className="px-6 py-4 font-code text-xs">{tx.userPhone}</td>
                        <td className="px-6 py-4 font-code text-xs text-muted-foreground uppercase">₹{tx.amount}</td>
                        <td className="px-6 py-4 font-code text-xs">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-primary font-bold">{tx.coins} C</span>
                              <span className="text-[8px] text-muted-foreground uppercase">Requested</span>
                            </div>
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
                              <Button size="icon" variant="ghost" onClick={() => approveTransaction(tx.transactionId)} className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => declineTransaction(tx.transactionId)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removeTransaction(tx.transactionId)} className="h-8 w-8 text-muted-foreground hover:text-white">
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

          <TabsContent value="settings" className="max-w-2xl space-y-6">
            <Card className="glass-card border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-headline tracking-widest uppercase flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Package Management
                </CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/80 gap-2 font-bold uppercase tracking-widest text-[10px]">
                      <PlusCircle className="w-3 h-3" /> ADD PACKAGE
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="text-primary uppercase font-headline">New Package</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-code uppercase text-muted-foreground">Package Name</label>
                        <Input placeholder="e.g. MEGA PACK" value={addName} onChange={e => setAddName(e.target.value)} className="bg-black border-white/10 text-white font-code" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-code uppercase text-muted-foreground">Price (₹)</label>
                          <Input type="number" placeholder="50" value={addPrice} onChange={e => setAddPrice(e.target.value)} className="bg-black border-white/10 text-primary font-code" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-code uppercase text-muted-foreground">Credits</label>
                          <Input type="number" placeholder="20" value={addCoins} onChange={e => setAddCoins(e.target.value)} className="bg-black border-white/10 text-primary font-code" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddPackage} disabled={isAdding} className="w-full bg-primary font-bold tracking-widest">
                        {isAdding ? "CREATING..." : "ADD PACKAGE"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pkgLoading ? (
                    <div className="flex flex-col items-center py-8 opacity-50">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                      <span className="text-[10px] font-code">SYNCING_PACKAGES...</span>
                    </div>
                  ) : packages?.length === 0 ? (
                    <div className="flex flex-col items-center py-12 bg-white/5 border border-dashed border-white/10 rounded-lg opacity-50">
                      <AlertTriangle className="w-8 h-8 mb-2" />
                      <p className="text-[10px] font-code uppercase">No packages found. Add one to start.</p>
                    </div>
                  ) : (
                    packages?.map((pkg) => (
                      <PackageEditorRow key={pkg.id} pkg={pkg} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline tracking-widest uppercase flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" /> Security Core
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
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
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-code uppercase text-muted-foreground">Master Access Code</label>
                    <Input 
                      type="password" 
                      placeholder="NEW_ADMIN_PASSCODE" 
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="bg-black/50 border-white/10 text-primary font-code"
                    />
                  </div>
                  <Button type="submit" disabled={isUpdating} className="w-full bg-primary font-bold uppercase tracking-widest h-12">
                    {isUpdating ? "SYNCHRONIZING..." : "COMMIT_CHANGES"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
