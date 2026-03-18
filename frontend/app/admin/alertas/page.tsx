'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAlertas } from '@/lib/api-hooks';
import { Alerta } from '@/lib/types';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Filter } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  acceso_denegado: 'Acceso Denegado',
  horario_inusual: 'Horario Inusual',
  score_bajo: 'Score Bajo',
  multiple_intentos: 'Múltiples Intentos',
};

const TIPO_ICONS: Record<string, string> = {
  acceso_denegado: '🚫',
  horario_inusual: '🕐',
  score_bajo: '📊',
  multiple_intentos: '🔄',
};

type FiltroEstado = 'todos' | 'nueva' | 'revisada' | 'resuelta';

export default function AlertasPage() {
  const { data, isLoading } = useAlertas();
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtrosPrioridad, setFiltrosPrioridad] = useState<string[]>([]);

  const alertas = data?.results || [];

  const filtradas = alertas.filter(a => {
    const estadoOk = filtroEstado === 'todos' || a.estado === filtroEstado;
    const prioridadOk = filtrosPrioridad.length === 0 || filtrosPrioridad.includes(a.prioridad);
    return estadoOk && prioridadOk;
  });

  const nuevas = alertas.filter(a => a.estado === 'nueva').length;
  const revisadas = alertas.filter(a => a.estado === 'revisada').length;
  const resueltas = alertas.filter(a => a.estado === 'resuelta').length;

  const getPrioridadColor = (p: string) => {
    if (p === 'alta') return 'bg-red-100 text-red-700 border-red-200';
    if (p === 'media') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getEstadoColor = (e: string) => {
    if (e === 'nueva') return 'bg-red-500';
    if (e === 'revisada') return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin', 'seguridad']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Alertas</h1>
            <p className="text-slate-600 mt-1">Eventos que requieren atención del equipo de seguridad</p>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setFiltroEstado(filtroEstado === 'nueva' ? 'todos' : 'nueva')}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                filtroEstado === 'nueva'
                  ? 'border-red-400 bg-red-50 shadow-md shadow-red-100'
                  : 'border-red-200 bg-red-50 hover:border-red-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Nuevas</p>
                  <p className="text-3xl font-bold text-red-900">{nuevas}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs text-red-600">Requieren atención inmediata</p>
              </div>
            </button>

            <button
              onClick={() => setFiltroEstado(filtroEstado === 'revisada' ? 'todos' : 'revisada')}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                filtroEstado === 'revisada'
                  ? 'border-amber-400 bg-amber-50 shadow-md shadow-amber-100'
                  : 'border-amber-200 bg-amber-50 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">En Revisión</p>
                  <p className="text-3xl font-bold text-amber-900">{revisadas}</p>
                </div>
              </div>
              <p className="text-xs text-amber-600">En proceso de investigación</p>
            </button>

            <button
              onClick={() => setFiltroEstado(filtroEstado === 'resuelta' ? 'todos' : 'resuelta')}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                filtroEstado === 'resuelta'
                  ? 'border-green-400 bg-green-50 shadow-md shadow-green-100'
                  : 'border-green-200 bg-green-50 hover:border-green-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Resueltas</p>
                  <p className="text-3xl font-bold text-green-900">{resueltas}</p>
                </div>
              </div>
              <p className="text-xs text-green-600">Gestionadas correctamente</p>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Filter className="h-4 w-4" />
              <span>Prioridad:</span>
            </div>
            {['alta', 'media', 'baja'].map(p => (
              <button
                key={p}
                onClick={() => setFiltrosPrioridad(prev =>
                  prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                )}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filtrosPrioridad.includes(p)
                    ? getPrioridadColor(p) + ' opacity-100'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            {(filtroEstado !== 'todos' || filtrosPrioridad.length > 0) && (
              <button
                onClick={() => { setFiltroEstado('todos'); setFiltrosPrioridad([]); }}
                className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Alerts list */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No hay alertas con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md bg-white ${
                    alerta.estado === 'nueva' ? 'border-red-200' :
                    alerta.estado === 'revisada' ? 'border-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Estado indicator */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-2.5 w-2.5 rounded-full ${getEstadoColor(alerta.estado)} ${alerta.estado === 'nueva' ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {TIPO_ICONS[alerta.tipo]} {TIPO_LABELS[alerta.tipo] || alerta.tipo}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${getPrioridadColor(alerta.prioridad)}`}>
                            {alerta.prioridad}
                          </span>
                          <Badge variant={alerta.estado === 'nueva' ? 'default' : 'outline'} className="text-xs">
                            {alerta.estado}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Evento #{alerta.evento_id}</p>
                        {alerta.revisada_por && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Revisada por: <span className="font-medium text-slate-600">{alerta.revisada_por}</span>
                            {alerta.notas && <span className="text-slate-400"> · {alerta.notas}</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {alerta.estado === 'nueva' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          Revisar
                        </Button>
                      </div>
                    )}
                    {alerta.estado === 'revisada' && (
                      <Button size="sm" variant="outline" className="text-xs h-8 text-green-600 border-green-300 hover:bg-green-50 flex-shrink-0">
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
