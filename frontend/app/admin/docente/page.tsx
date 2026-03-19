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

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTO = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const AULA_COLORS = [
  { bg: 'bg-blue-50',    border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-500' },
  { bg: 'bg-purple-50',  border: 'border-l-purple-500',  badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-emerald-50', border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-50',   border: 'border-l-amber-500',   badge: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500' },
  { bg: 'bg-rose-50',    border: 'border-l-rose-500',    badge: 'bg-rose-100 text-rose-800',     dot: 'bg-rose-500' },
  { bg: 'bg-cyan-50',    border: 'border-l-cyan-500',    badge: 'bg-cyan-100 text-cyan-800',     dot: 'bg-cyan-500' },
];

function horaToMin(h: string) {
  const [hr, mn] = h.split(':').map(Number);
  return hr * 60 + mn;
}

export default function DocenteDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: permisosData } = usePermisos(user?.id);
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
      setOtpCodigo(res.codigo);
      setOtpExpira(new Date(res.expira_en));
      setTiempoRestante(300);
      toast({ title: 'OTP generado', description: 'Válido por 5 minutos' });
    } catch {
      toast({ title: 'Error al generar OTP', variant: 'destructive' });
    }
  };

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Build schedule entries
  const clases = permisos.map((p, idx) => {
    const horario = horarios.find(h => h.id === p.schedule);
    if (!horario || !p.is_active) return null;
    const color = AULA_COLORS[idx % AULA_COLORS.length];
    return { horario, aula: p.aula, color };
  }).filter(Boolean) as { horario: any; aula: any; color: typeof AULA_COLORS[0] }[];

  // Group by day
  const clasesPorDia: Record<number, typeof clases> = {};
  clases.forEach(c => {
    const dia = c.horario.day_of_week;
    if (!clasesPorDia[dia]) clasesPorDia[dia] = [];
    clasesPorDia[dia].push(c);
  });

  const todayDia = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const clasesHoy = clasesPorDia[todayDia] || [];

  const progressPct = otpExpira ? (tiempoRestante / 300) * 100 : 0;
  const progressColor = tiempoRestante > 180 ? 'bg-green-500' : tiempoRestante > 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <RoleGuard allowedRoles={['DOCENTE']}>
      <AdminLayout>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Bienvenido, {user?.nombre} 👋
              </h1>
              <p className="text-slate-500 mt-1">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">Docente</Badge>
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ===== Schedule Column (2/3) ===== */}
            <div className="lg:col-span-2 space-y-6">

              {/* Today's classes */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-slate-600" />
                      <CardTitle className="text-lg">
                        Hoy — {DIAS[todayDia]}
                      </CardTitle>
                    </div>
                    <Badge variant={clasesHoy.length > 0 ? 'default' : 'outline'}>
                      {clasesHoy.length} clase{clasesHoy.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {clasesHoy.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>No tienes clases asignadas hoy</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...clasesHoy].sort((a, b) => horaToMin(a.horario.start_time) - horaToMin(b.horario.start_time)).map((c, i) => (
                        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${c.color.bg} ${c.color.border} border border-l-4`}>
                          <div className="text-center min-w-[56px]">
                            <p className="text-xs font-mono font-bold text-slate-700">{c.horario.start_time}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{c.horario.end_time}</p>
                          </div>
                          <div className="h-10 w-px bg-slate-200 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900">
                              {c.aula?.description || `Aula ${c.aula?.code}`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-500">{c.aula?.code}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.color.badge}`}>
                            {c.horario.day_label || c.horario.start_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly schedule */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-600" />
                    <CardTitle className="text-lg">Horario Semanal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(dia => {
                      const clasesDelDia = (clasesPorDia[dia] || []).sort(
                        (a, b) => horaToMin(a.horario.start_time) - horaToMin(b.horario.start_time)
                      );
                      const isToday = dia === todayDia;
                      return (
                        <div key={dia} className={`rounded-xl overflow-hidden border ${isToday ? 'border-blue-300 shadow-sm shadow-blue-100' : 'border-slate-200'}`}>
                          {/* Day header */}
                          <div className={`py-2 text-center text-xs font-bold uppercase tracking-wide ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {DIAS_CORTO[dia]}
                          </div>
                          {/* Classes */}
                          <div className="p-1.5 space-y-1.5 min-h-[80px]">
                            {clasesDelDia.length === 0 ? (
                              <div className="h-10 flex items-center justify-center">
                                <span className="text-[10px] text-slate-300">—</span>
                              </div>
                            ) : (
                              clasesDelDia.map((c, i) => (
                                <div key={i} className={`rounded-lg p-1.5 border ${c.color.bg} ${c.color.border.replace('border-l-', 'border-')}`}>
                                  <p className="text-[10px] font-bold text-slate-700 leading-tight">{c.aula?.code}</p>
                                  <p className="text-[9px] text-slate-500 font-mono leading-tight">{c.horario.start_time}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    {clases.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${c.color.dot}`} />
                        <span className="text-xs text-slate-500">{c.aula?.code} — {c.aula?.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ===== OTP Column (1/3) ===== */}
            <div className="space-y-4">
              <Card className="border-slate-200">
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
                    <p className="text-[10px] text-amber-600 pt-1">El código es válido por 5 minutos y de un solo uso.</p>
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
