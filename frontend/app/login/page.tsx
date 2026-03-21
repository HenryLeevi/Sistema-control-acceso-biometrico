'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Eye, EyeOff, Unlock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Animation states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { roles } = await login(username.trim(), password.trim());
      
      // 1. Success! Trigger door opening animation
      setIsUnlocked(true);
      
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Bienvenido al sistema. Abriendo bóveda...',
      });
      
      // 2. Wait for the door to open before redirecting (approx 900ms)
      setTimeout(() => {
        const upperRoles = roles.map(r => r.toUpperCase());
        if (upperRoles.includes('ADMIN')) {
          router.push('/admin');
        } else if (upperRoles.includes('SUBADMIN')) {
          router.push('/subadmin');
        } else if (upperRoles.includes('DOCENTE')) {
          router.push('/docente');
        } else if (upperRoles.includes('BIOMETRICO') || upperRoles.includes('PWA')) {
          router.push('/biometrico');
        } else {
          router.push('/admin'); // Fallback
        }
      }, 900);
      
    } catch (error) {
      // 1. Failure! Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500); // Remove class after animation ends
      
      toast({
        title: 'Acceso Denegado',
        description: error instanceof Error ? error.message : 'Credenciales inválidas',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const isMockMode = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 overflow-hidden relative">
        {/* Background ambient lighting that flashes green on success */}
        <div className={cn(
          "absolute inset-0 bg-emerald-500/20 transition-opacity duration-1000",
          isUnlocked ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute inset-0 bg-red-500/20 transition-opacity duration-300",
          isShaking ? "opacity-100" : "opacity-0"
        )} />

        {isMockMode && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-medium z-50">
            Modo Demostración Activo - Usando datos simulados (sin backend)
          </div>
        )}
        
        {/* The Door Container */}
        <div style={{ perspective: '1200px' }} className="z-10 w-full max-w-md">
          <Card 
            className={cn(
              "shadow-2xl border-4 border-amber-950 bg-amber-800 text-amber-50 relative overflow-hidden",
              isUnlocked ? "door-open" : "door-closed",
              isShaking ? "animate-shake border-red-500" : ""
            )}
          >
            {/* Wooden Door Panels */}
            <div className="absolute inset-4 border-2 border-[rgba(255,255,255,0.05)] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-sm pointer-events-none" />
            
            {/* Doorknob (Manija) & Keyhole (Cerradura) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-none z-20">
              {/* Knob */}
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-800 border-2 border-yellow-900 shadow-[2px_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tl from-yellow-600 to-yellow-400 shadow-inner" />
              </div>
              {/* Keyhole Plate */}
              <div className="h-14 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-800 border-[1.5px] border-yellow-900 shadow-xl flex flex-col items-center justify-center py-2">
                 <div className="h-4 w-4 rounded-full bg-amber-950 shadow-inner" />
                 <div className="h-5 w-2 bg-amber-950 -mt-1 rounded-sm shadow-inner" />
              </div>
            </div>

            <CardHeader className="space-y-1 text-center border-b border-amber-900 pb-6 bg-amber-900/40 relative pt-8 z-10 px-12">
              <div className="flex justify-center mb-4 relative z-10">
                <div className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] border-4 transition-colors duration-500",
                  isUnlocked ? "bg-emerald-600 border-emerald-500" 
                             : isShaking ? "bg-red-600 border-red-500" 
                             : "bg-amber-950 border-amber-900"
                )}>
                  {isUnlocked ? <Unlock className="h-10 w-10 text-emerald-100" /> : <Lock className="h-10 w-10 text-amber-500" />}
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-amber-50 tracking-tight font-serif italic">Acceso Biométrico</CardTitle>
              <CardDescription className="text-amber-200/80 font-medium text-sm mt-2">
                {isUnlocked ? 'Bienvenido a casa...' : 'Ingrese su código para entrar'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 pb-8 px-10 relative z-10 mr-12">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-amber-100 text-xs font-bold uppercase tracking-wider">Identificación</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-amber-950/50 border-amber-800 text-amber-100 focus:border-amber-500 rounded placeholder:text-amber-700/50 h-12 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-amber-100 text-xs font-bold uppercase tracking-wider">Llave de Acceso</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-amber-950/50 border-amber-800 text-amber-100 focus:border-amber-500 rounded placeholder:text-amber-700/50 h-12 pr-12 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-400 transition-colors p-1.5 rounded-md"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 mt-2 font-bold tracking-widest uppercase transition-all duration-300 rounded shadow-lg",
                    isUnlocked 
                      ? "bg-emerald-700 hover:bg-emerald-600 text-white" 
                      : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900"
                  )}
                >
                  {isLoading ? 'Abriendo cerradura...' : isUnlocked ? 'Adelante...' : 'Empujar Puerta'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
