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
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { approveRequest, declineRequest, removeRequest, updateSystemConfig } from '@/app/lib/lookup-actions';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  // Form states for settings
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newSitePass, setNewSitePass] = useState('');
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

  const requestsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: requests, loading: reqLoading } = useCollection(requestsQuery);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    router.push('/admin/login');
  };

  const onApprove = async (id: string) => {
    const res = await approveRequest(id);
    if (res.success) toast({ title: "Approved", description: `Request ${id} status updated.` });
  };

  const onDecline = async (id: string) => {
    const res = await declineRequest(id);
    if (res.success) toast({ title: "Declined", description: `Request ${id} status updated.` });
  };

  const onDelete = async (id: string) => {
    const res = await removeRequest(id);
    if (res.success) toast({ title: "Deleted", description: `Request ${id} removed.` });
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updates: any = {};
      if (newAdminPass) updates.adminPassword = newAdminPass;
      if (newSitePass) updates.sitePassword = newSitePass;

      if (Object.keys(updates).length > 0) {
        await updateSystemConfig(updates);
        toast({ title: "Updated", description: "System credentials modified successfully." });
        
        // If admin pass changed, update local storage to prevent auto-logout
        if (newAdminPass) localStorage.setItem('admin_auth_token', newAdminPass);
        
        setNewAdminPass('');
        setNewSitePass('');
      }
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
      {/* Header */}
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
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="requests" className="gap-2 uppercase font-code text-xs">
              <Database className="w-3 h-3" />
              Operational Requests
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 uppercase font-code text-xs">
              <Settings className="w-3 h-3" />
              System Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-white/5">
                <CardHeader className="py-4">
                  <CardTitle className="text-xs font-code text-muted-foreground uppercase flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Live Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold font-headline">{requests?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total Requests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-headline text-primary">
                      {requests?.filter(r => r.status === 'pending').length || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Pending Approval</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase font-code text-muted-foreground bg-white/5">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Target Number</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Used</th>
                      <th className="px-6 py-4 text-right">Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reqLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-code">SYNCING_DATABASE...</td>
                      </tr>
                    ) : requests?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-code">NO_ACTIVE_RECORDS</td>
                      </tr>
                    ) : requests?.map((req) => (
                      <tr key={req.requestId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-code text-xs text-primary">{req.requestId}</td>
                        <td className="px-6 py-4 font-code text-xs">{req.phoneNumber || '---'}</td>
                        <td className="px-6 py-4 text-[10px] text-muted-foreground uppercase">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' :
                            req.status === 'declined' ? 'bg-destructive/10 border-destructive/50 text-destructive' :
                            'bg-primary/10 border-primary/50 text-primary animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {req.used ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground/30" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {req.status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => onApprove(req.requestId)} className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => onDecline(req.requestId)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => onDelete(req.requestId)} className="h-8 w-8 text-muted-foreground hover:text-white">
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
                      placeholder="Enter New Admin Password" 
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="bg-black/50 border-white/10 text-primary font-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-code uppercase text-muted-foreground">Terminal Access Password</label>
                    <Input 
                      type="text" 
                      placeholder="Enter New Website Password" 
                      value={newSitePass}
                      onChange={(e) => setNewSitePass(e.target.value)}
                      className="bg-black/50 border-white/10 text-primary font-code"
                    />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" disabled={isUpdating} className="w-full bg-primary font-bold uppercase tracking-widest h-12">
                      {isUpdating ? "SYNCHRONIZING..." : "COMMIT_CHANGES"}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Current Configuration</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-code">
                    <div>
                      <p className="text-muted-foreground uppercase">Site Password:</p>
                      <p className="text-foreground">{config?.sitePassword || 'NOT_SET'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase">Admin Password:</p>
                      <p className="text-foreground">••••••••</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
