'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHorarios, useCreateHorario, usePermisos, useUsuarios, useAulas } from '@/lib/api-hooks';
import { Horario } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DIAS = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
];

const DIAS_COMPLETOS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const HORAS_GRID = Array.from({ length: 13 }, (_, i) => {
  const h = 7 + i;
  return `${String(h).padStart(2, '0')}:00`;
});

const BLOQUE_COLORS = [
  { bg: 'bg-blue-100',   border: 'border-blue-400',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  { bg: 'bg-purple-100', border: 'border-purple-400',  text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-emerald-100',border: 'border-emerald-400', text: 'text-emerald-800',dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100',  border: 'border-amber-400',   text: 'text-amber-800',  dot: 'bg-amber-500' },
  { bg: 'bg-rose-100',   border: 'border-rose-400',    text: 'text-rose-800',   dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100',   border: 'border-cyan-400',    text: 'text-cyan-800',   dot: 'bg-cyan-500' },
];

function horaToMin(h: string) {
  const [hr, mn] = h.split(':').map(Number);
  return hr * 60 + mn;
}

function gridRowForTime(hora: string) {
  // Grid starts at 07:00 (row 2 = first data row); each row = 1hr
  const min = horaToMin(hora);
  return Math.floor((min - 7 * 60) / 60) + 2;
}

function gridSpanForDuration(inicio: string, fin: string) {
  return Math.max(1, (horaToMin(fin) - horaToMin(inicio)) / 60);
}

const DIAS_SEMANA_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export default function HorariosPage() {
  const { data, isLoading } = useHorarios();
  const { data: permisosData } = usePermisos();
  const { data: usuariosData } = useUsuarios();
  const { data: aulasData } = useAulas();
  const createHorario = useCreateHorario();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [formData, setFormData] = useState({
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fin: '10:00',
    descripcion: '',
  });

  const today = new Date().getDay(); // 0=Dom, 1=Lun...
  const todayDiaValue = today === 0 ? 7 : today;

  const horarios = data?.results || [];
  const permisos = permisosData?.results || [];
  const usuarios = usuariosData?.results || [];
  const aulas = aulasData?.results || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHorario.mutateAsync(formData);
      toast({ title: 'Horario creado correctamente' });
      setIsDialogOpen(false);
      setFormData({ dia_semana: 1, hora_inicio: '08:00', hora_fin: '10:00', descripcion: '' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error', variant: 'destructive' });
    }
  };

  // Build enriched blocks for calendar
  const bloques = horarios.map((h, idx) => {
    const permisosDeHorario = permisos.filter(p => p.horario_id === h.id);
    const color = BLOQUE_COLORS[idx % BLOQUE_COLORS.length];
    return { horario: h, permisos: permisosDeHorario, color };
  });

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Horarios</h1>
              <p className="text-slate-600 mt-1">Franjas horarias de acceso al sistema</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                    viewMode === 'calendar' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Calendario
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                  Lista
                </button>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Horario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nuevo Horario</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Día de la Semana</Label>
                      <Select value={String(formData.dia_semana)} onValueChange={(v) => setFormData({ ...formData, dia_semana: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIAS_SEMANA_OPTIONS.map(d => (
                            <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hora Inicio</Label>
                        <Input type="time" value={formData.hora_inicio} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora Fin</Label>
                        <Input type="time" value={formData.hora_fin} onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción (Opcional)</Label>
                      <Input placeholder="Ej: Turno Mañana" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={createHorario.isPending}>
                        {createHorario.isPending ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Days header */}
              <div
                className="grid bg-slate-50 border-b border-slate-200"
                style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}
              >
                <div className="p-3 text-xs text-slate-400 font-medium border-r border-slate-200" />
                {DIAS.map((dia) => (
                  <div
                    key={dia.value}
                    className={`p-3 text-center border-r border-slate-200 last:border-0 ${
                      dia.value === todayDiaValue ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-wide ${
                      dia.value === todayDiaValue ? 'text-blue-600' : 'text-slate-500'
                    }`}>{dia.label}</p>
                    {dia.value === todayDiaValue && (
                      <div className="h-1 w-6 bg-blue-500 rounded mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Time + content grid */}
              <div
                className="grid overflow-y-auto"
                style={{
                  gridTemplateColumns: '64px repeat(6, 1fr)',
                  gridTemplateRows: `repeat(${HORAS_GRID.length}, 56px)`,
                  maxHeight: '520px',
                }}
              >
                {/* Time labels */}
                {HORAS_GRID.map((hora, rowIdx) => (
                  <div
                    key={hora}
                    className="border-r border-b border-slate-100 flex items-start justify-center pt-2"
                    style={{ gridColumn: 1, gridRow: rowIdx + 1 }}
                  >
                    <span className="text-[11px] text-slate-400 font-mono">{hora}</span>
                  </div>
                ))}

                {/* Day column backgrounds */}
                {DIAS.map((dia, colIdx) => (
                  HORAS_GRID.map((_, rowIdx) => (
                    <div
                      key={`${dia.value}-${rowIdx}`}
                      className={`border-r border-b border-slate-100 last:border-r-0 ${
                        dia.value === todayDiaValue ? 'bg-blue-50/40' : ''
                      }`}
                      style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1 }}
                    />
                  ))
                ))}

                {/* Schedule blocks */}
                {bloques.map(({ horario: h, permisos: ps, color }) => {
                  const col = h.dia_semana; // 1=Lun → gridColumn 2
                  const rowStart = gridRowForTime(h.hora_inicio);
                  const span = gridSpanForDuration(h.hora_inicio, h.hora_fin);

                  if (col > 6) return null; // No mostrar Dom en esta vista

                  const permisosActivos = ps.filter(p => p.activo);
                  const aulasCubiertas = Array.from(new Set(permisosActivos.map(p => {
                    const aula = aulas.find(a => a.id === p.aula_id);
                    return aula?.codigo || p.aula_id;
                  })));

                  return (
                    <div
                      key={h.id}
                      className={`m-0.5 rounded-lg border-l-4 ${color.bg} ${color.border} px-2 py-1.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        gridColumn: col + 1,
                        gridRow: `${rowStart} / span ${span}`,
                      }}
                      title={`${h.descripcion || ''} · ${h.hora_inicio}–${h.hora_fin}`}
                    >
                      <p className={`text-xs font-bold leading-tight ${color.text}`}>
                        {h.hora_inicio}–{h.hora_fin}
                      </p>
                      {h.descripcion && (
                        <p className={`text-[10px] leading-tight mt-0.5 ${color.text} opacity-80 truncate`}>
                          {h.descripcion}
                        </p>
                      )}
                      {aulasCubiertas.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {aulasCubiertas.slice(0, 2).map(aula => (
                            <span key={aula} className={`text-[9px] font-medium px-1 rounded ${color.text} bg-white/50`}>
                              {aula}
                            </span>
                          ))}
                          {aulasCubiertas.length > 2 && (
                            <span className={`text-[9px] ${color.text}`}>+{aulasCubiertas.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="border-t border-slate-100 p-3 flex flex-wrap gap-2">
                {bloques.slice(0, 6).map(({ horario: h, color }) => (
                  <div key={h.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <div className={`h-2.5 w-2.5 rounded-sm ${color.dot}`} />
                    {h.descripcion || `H${h.id}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))
              ) : (
                horarios.map((h, idx) => {
                  const color = BLOQUE_COLORS[idx % BLOQUE_COLORS.length];
                  const permisosH = permisos.filter(p => p.horario_id === h.id && p.activo);
                  return (
                    <div key={h.id} className={`flex items-center gap-4 p-4 rounded-xl border ${color.bg} ${color.border}`}>
                      <div className={`w-1 h-12 rounded-full ${color.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${color.text}`}>
                          {DIAS_COMPLETOS[h.dia_semana]} · {h.hora_inicio} – {h.hora_fin}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{h.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${color.text} border-current`}>
                          {permisosH.length} permiso{permisosH.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
