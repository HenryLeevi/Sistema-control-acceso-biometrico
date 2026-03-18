'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Bienvenido al sistema',
      });
      router.push('/admin');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Credenciales inválidas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isMockMode = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-medium z-50">
        Modo Demostración Activo - Usando datos simulados (sin backend)
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center">
              <Fingerprint className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Control de Accesos Biométrico</CardTitle>
          <CardDescription>Ingrese sus credenciales para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Credenciales de Demostración</p>
            <div className="space-y-2 text-xs text-blue-800">
              <div className="flex justify-between items-center">
                <span>Admin:</span>
                <code className="bg-white px-2 py-1 rounded font-mono">admin / password123</code>
              </div>
              <div className="flex justify-between items-center">
                <span>Docente:</span>
                <code className="bg-white px-2 py-1 rounded font-mono">docente1 / password123</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
