'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Shield, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MatrixBackground } from '@/components/MatrixBackground';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Authorized", description: "Admin terminal access granted." });
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Error", description: error.message });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MatrixBackground />
      <div className="scanline opacity-10"></div>
      
      <Card className="w-full max-w-md glass-card border-primary/20">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline tracking-widest text-glow-red">ADMIN CONSOLE</CardTitle>
          <p className="text-xs text-muted-foreground font-code uppercase tracking-widest mt-2">Restricted Operational Unit</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-code text-primary uppercase tracking-widest ml-1">Terminal ID</label>
              <Input
                type="email"
                placeholder="admin@number-intel.io"
                className="bg-black/50 border-primary/20 text-primary font-code"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-code text-primary uppercase tracking-widest ml-1">Access Cipher</label>
              <Input
                type="password"
                placeholder="••••••••••••"
                className="bg-black/50 border-primary/20 text-primary font-code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/80 group transition-all"
            >
              {isLoading ? "INITIATING..." : (
                <span className="flex items-center gap-2 uppercase tracking-widest font-bold">
                  ENGAGE TERMINAL
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
