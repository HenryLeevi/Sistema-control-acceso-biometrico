'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usePermisos, useHorarios } from '@/lib/api-hooks';
import { RoleGuard } from '@/components/role-guard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, QrCode, History, Clock, MapPin, ChevronRight } from 'lucide-react';
import { DocenteTutorial } from '@/components/docente-tutorial';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const AULA_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'A-101': { bg: 'bg-blue-500/20',   border: 'border-blue-500/50',   text: 'text-blue-300' },
  'A-102': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300' },
  'B-201': { bg: 'bg-emerald-500/20',border: 'border-emerald-500/50',text: 'text-emerald-300' },
  'C-301': { bg: 'bg-amber-500/20',  border: 'border-amber-500/50',  text: 'text-amber-300' },
  'D-101': { bg: 'bg-rose-500/20',   border: 'border-rose-500/50',   text: 'text-rose-300' },
};

function getColorForAula(code: string) {
  return AULA_COLORS[code] || { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-300' };
}

function horaToMinutes(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export default function PWAHomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: permisosData } = usePermisos(user?.id);
  const { data: horariosData } = useHorarios();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const permisos = permisosData?.results || [];
  const horarios = horariosData?.results || [];

  const todayDia = new Date().getDay(); // 0=Dom, 1=Lun...
  const todayIdx = todayDia === 0 ? 6 : todayDia - 1; // Lun=0

  // Build schedule blocks using backend field names
  const bloques = permisos.map(p => {
    const horario = horarios.find(h => h.id === p.schedule);
    if (!horario) return null;
    const aulaCode = typeof p.aula === 'string' ? p.aula : '';
    const colors = getColorForAula(aulaCode);
    return {
      dia: horario.day_of_week - 1, // 0=Lun
      start_time: horario.start_time,
      end_time: horario.end_time,
      aulaCode,
      colors,
    };
  }).filter(Boolean) as {
    dia: number;
    start_time: string;
    end_time: string;
    aulaCode: string;
    colors: { bg: string; border: string; text: string };
  }[];

  // Today's classes
  const clasesHoy = bloques.filter(b => b.dia === todayIdx);

  return (
    <RoleGuard allowedRoles={['DOCENTE', 'ADMIN', 'SUBADMIN', 'BIOMETRICO']}>
      <DocenteTutorial />
      <div className="min-h-screen bg-slate-950 text-white">

        {/* Header */}
        <header data-tour="user-profile" className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                  {user?.nombre?.[0]}{user?.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.nombre} {user?.apellido}</p>
                <div className="flex gap-1 mt-0.5">
                  {user?.roles?.map(r => (
                    <Badge key={r} variant="secondary" className="text-[10px] py-0 h-4">{r}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors p-2">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-5 space-y-6 pb-24">

          {/* Today's summary */}
          <div data-tour="today-summary">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">
                Hoy — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300">
                {clasesHoy.length} clase{clasesHoy.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {clasesHoy.length === 0 ? (
              <div className="bg-slate-900 rounded-xl p-4 text-center text-slate-500 text-sm">
                No tienes asignaciones hoy
              </div>
            ) : (
              <div className="space-y-2">
                {clasesHoy.map((b, i) => (
                  <div key={i} className={`rounded-xl p-3 border ${b.colors.bg} ${b.colors.border} flex items-center gap-3`}>
                    <div className={`flex-shrink-0 text-center ${b.colors.text}`}>
                      <Clock className="h-4 w-4 mx-auto mb-0.5" />
                      <p className="text-xs font-mono font-bold">{b.start_time}</p>
                      <p className="text-xs font-mono text-slate-500">{b.end_time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${b.colors.text}`}>{b.aulaCode}</p>
                    </div>
                    <MapPin className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly schedule - Grid style */}
          <div data-tour="weekly-schedule">
            <h2 className="text-base font-semibold mb-3">Horario Semanal</h2>
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
              {/* Day headers */}
              <div className="grid border-b border-white/10" style={{ gridTemplateColumns: '48px repeat(6, 1fr)' }}>
                <div className="border-r border-white/10 bg-slate-800/50" />
                {DIAS.map((dia, i) => (
                  <div
                    key={dia}
                    className={`py-2 text-center text-xs font-semibold border-r border-white/5 last:border-0 ${
                      i === todayIdx ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'
                    }`}
                  >
                    {dia}
                    {i === todayIdx && <div className="h-0.5 w-4 bg-blue-400 rounded mx-auto mt-0.5" />}
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                {HORAS.slice(0, -1).map((hora, rowIdx) => (
                  <div key={hora} className="grid border-b border-white/5 last:border-0" style={{ gridTemplateColumns: '48px repeat(6, 1fr)', minHeight: '44px' }}>
                    {/* Time label */}
                    <div className="border-r border-white/10 flex items-center justify-center">
                      <span className="text-[10px] text-slate-600 font-mono">{hora}</span>
                    </div>
                    {/* Day cells */}
                    {DIAS.map((_, colIdx) => {
                      const bloqueStart = bloques.find(b =>
                        b.dia === colIdx && b.start_time === hora
                      );

                      return (
                        <div key={colIdx} className={`border-r border-white/5 last:border-0 relative p-0.5 ${colIdx === todayIdx ? 'bg-blue-500/5' : ''}`}>
                          {bloqueStart && (
                            <div className={`rounded-lg ${bloqueStart.colors.bg} ${bloqueStart.colors.border} border px-1.5 py-1 h-full`}>
                              <p className={`text-[10px] font-bold leading-tight ${bloqueStart.colors.text}`}>
                                {bloqueStart.aulaCode}
                              </p>
                              <p className="text-[9px] text-slate-500 leading-tight">
                                {bloqueStart.start_time}–{bloqueStart.end_time}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(AULA_COLORS).map(([code, colors]) => (
                <div key={code} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border ${colors.bg} ${colors.border} ${colors.text}`}>
                  <div className={`h-1.5 w-1.5 rounded-full bg-current`} />
                  {code}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Bottom action bar */}
        <div data-tour="otp-section" className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={() => router.push('/docente/historial')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-all"
            >
              <History className="h-5 w-5" />
              Historial
            </button>
            <button
              onClick={() => router.push('/docente/otp')}
              className="flex-2 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              <QrCode className="h-5 w-5" />
              Generar OTP
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
