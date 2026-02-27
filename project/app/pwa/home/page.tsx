'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleGuard } from '@/components/role-guard';
import { Fingerprint, QrCode, History, LogOut } from 'lucide-react';

export default function PWAHomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/pwa/login');
  };

  return (
    <RoleGuard allowedRoles={['docente', 'admin', 'subadmin', 'seguridad']}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <Fingerprint className="h-6 w-6" />
              <h1 className="text-lg font-semibold">Control de Acceso</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="max-w-md mx-auto p-4 space-y-6 pb-20">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-slate-900 text-white text-2xl">
                    {user?.nombre?.[0]}{user?.apellido?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{user?.nombre} {user?.apellido}</CardTitle>
              <div className="flex justify-center gap-2 mt-2">
                {user?.roles.map(role => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Usuario:</span>
                  <span>{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estado:</span>
                  <Badge variant={user?.activo ? 'default' : 'secondary'}>
                    {user?.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Biometría:</span>
                  <Badge variant={user?.biometria_enrolada ? 'default' : 'outline'}>
                    {user?.biometria_enrolada ? 'Enrolada' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="h-32 flex-col space-y-2"
              onClick={() => router.push('/pwa/otp')}
            >
              <QrCode className="h-10 w-10" />
              <div className="text-center">
                <div className="font-semibold">Generar</div>
                <div className="text-xs opacity-90">Código OTP</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-32 flex-col space-y-2"
              onClick={() => router.push('/pwa/historial')}
            >
              <History className="h-10 w-10" />
              <div className="text-center">
                <div className="font-semibold">Historial</div>
                <div className="text-xs opacity-70">Mis accesos</div>
              </div>
            </Button>
          </div>

          <Card className="bg-slate-100 border-slate-200">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-medium">¿Cómo usar el código OTP?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toca el botón &quot;Generar Código OTP&quot;</li>
                  <li>Muestra el código al personal de seguridad</li>
                  <li>El código es válido por 5 minutos</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </RoleGuard>
  );
}
