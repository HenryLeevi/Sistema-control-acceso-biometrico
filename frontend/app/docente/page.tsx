'use client';

import { useAuth } from '@/lib/auth-context';
import { usePermisos, useHorarios, useGenerarOTP } from '@/lib/api-hooks';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, QrCode, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DocenteTutorial } from '@/components/docente-tutorial';
import { WeeklyCalendar } from '@/components/weekly-calendar';
import { AccessPermission } from '@/lib/types';


export default function DocenteDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: permisosData } = usePermisos(user?.local_user_id || undefined);
  const { data: horariosData } = useHorarios();
  const generarOTP = useGenerarOTP();

  const [otpCodigo, setOtpCodigo] = useState<string | null>(null);
  const [otpExpira, setOtpExpira] = useState<Date | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const permisos = permisosData?.results || [];
  const horarios = horariosData?.results || [];

  // OTP countdown
  useEffect(() => {
    if (!otpExpira) return;
    const interval = setInterval(() => {
      const diff = Math.floor((otpExpira.getTime() - Date.now()) / 1000);
      setTiempoRestante(diff <= 0 ? 0 : diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpira]);

  const handleGenerarOTP = async () => {
    try {
      const res = await generarOTP.mutateAsync();
      setOtpCodigo(res.code);
      setOtpExpira(new Date(res.expires_at));
      setTiempoRestante(600); // 10 minutes (600 seconds)
      toast({ title: 'OTP generado', description: 'Válido por 10 minutos' });
    } catch {
      toast({ title: 'Error al generar OTP', variant: 'destructive' });
    }
  };

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };


  const progressPct = otpExpira ? (tiempoRestante / 600) * 100 : 0;
  const progressColor = tiempoRestante > 300 ? 'bg-green-500' : tiempoRestante > 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <RoleGuard allowedRoles={['DOCENTE']}>
      <DocenteTutorial />
      <AdminLayout>
        <div className="space-y-6">

          {/* Header */}
          <div data-tour="user-profile" className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Bienvenido, {user?.nombre} 👋
              </h1>
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">Docente</Badge>
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ===== Schedule Column (2/3) ===== */}
            <div className="lg:col-span-2 space-y-6 min-w-0">


              {/* Weekly schedule */}
              <Card data-tour="weekly-schedule" className="overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="text-lg font-bold">Horario Semanal</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 w-fit">
                      Solo lectura
                    </Badge>
                  </div>
                </CardHeader>
                <div className="h-[400px] sm:h-[600px] overflow-hidden">
                  <WeeklyCalendar 
                    permissions={permisos as AccessPermission[]} 
                    readOnly={true} 
                  />
                </div>
              </Card>
            </div>

            {/* ===== OTP Column (1/3) ===== - Shown first on mobile */}
            <div className="space-y-4 min-w-0">
              <Card data-tour="otp-section" className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-slate-600" />
                    <CardTitle className="text-lg">Código OTP</CardTitle>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Genera un código temporal si no puedes autenticarte en el dispositivo de acceso
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">

                  {otpCodigo ? (
                    <>
                      {/* OTP display */}
                      <div className={`rounded-2xl p-6 text-center transition-colors ${tiempoRestante === 0 ? 'bg-slate-100' : 'bg-slate-900'}`}>
                        <p className={`text-4xl font-bold tracking-[0.3em] font-mono ${tiempoRestante === 0 ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {otpCodigo}
                        </p>
                      </div>

                      {/* Progress */}
                      {tiempoRestante > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="h-4 w-4" />
                              <span>Expira en</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{formatTiempo(tiempoRestante)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressColor} transition-all duration-1000 rounded-full`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Código activo — úsalo en dispositivo de acceso
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs text-red-600">Código expirado. Genera uno nuevo.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 p-8 text-center">
                      <QrCode className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">Genera un OTP de emergencia</p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerarOTP}
                    disabled={generarOTP.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generarOTP.isPending ? 'animate-spin' : ''}`} />
                    {generarOTP.isPending ? 'Generando...' : otpCodigo ? 'Regenerar OTP' : 'Generar OTP'}
                  </Button>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-amber-800">¿Cuándo usar el OTP?</p>
                    <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                      <li>Cuando el reconocimiento facial falla</li>
                      <li>Cuando no recuerdas tu PIN</li>
                      <li>En situaciones de emergencia</li>
                    </ul>
                    <p className="text-[10px] text-amber-600 pt-1">El código es válido por 10 minutos y de un solo uso.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}