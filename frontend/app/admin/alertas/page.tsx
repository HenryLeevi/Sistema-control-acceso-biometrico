'use client';

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAlertas } from '@/lib/api-hooks';
import { AccessEvent } from '@/lib/types';
import {
  CheckCircle2, XCircle, AlertTriangle, Search, Filter,
  Fingerprint, Lock, Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* ── Display helpers ──────────────────────────────────────── */

const METHOD_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  FACE: { label: 'Facial', icon: <Fingerprint className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  PIN:  { label: 'PIN',    icon: <Lock className="h-3.5 w-3.5" />,        color: 'bg-blue-100 text-blue-700 border-blue-200' },
  MANUAL: { label: 'Manual', icon: <Shield className="h-3.5 w-3.5" />,   color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const RESULT_CFG: Record<string, { label: string; icon: React.ReactNode; rowBg: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  SUCCESS: { label: 'Permitido', icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, rowBg: '', badge: 'default' },
  DENIED:  { label: 'Denegado', icon: <XCircle className="h-4 w-4 text-red-500" />,          rowBg: 'bg-red-50/40', badge: 'destructive' },
};

type FilterResult = 'all' | 'SUCCESS' | 'DENIED';
type FilterMethod = 'all' | 'FACE' | 'PIN' | 'MANUAL';

export default function AlertasPage() {
  const { data, isLoading } = useAlertas();
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<FilterResult>('all');
  const [filterMethod, setFilterMethod] = useState<FilterMethod>('all');
  const [showAlertOnly, setShowAlertOnly] = useState(false);

  const allEvents: AccessEvent[] = data?.results || [];

  /* Stats */
  const totalHoy = allEvents.length;
  const permitidos = allEvents.filter(e => e.result === 'SUCCESS').length;
  const denegados = allEvents.filter(e => e.result === 'DENIED').length;
  const alertas = allEvents.filter(e => e.alert_flag).length;

  /* Filtered list */
  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      if (filterResult !== 'all' && e.result !== filterResult) return false;
      if (filterMethod !== 'all' && e.method !== filterMethod) return false;
      if (showAlertOnly && !e.alert_flag) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.aula?.toLowerCase().includes(q) ||
          e.method?.toLowerCase().includes(q) ||
          e.reason?.toLowerCase().includes(q) ||
          e.result?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvents, filterResult, filterMethod, showAlertOnly, search]);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN', 'SEGURIDAD']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Registro de Actividad</h1>
            <p className="text-slate-600 mt-1">Todos los eventos del sistema — accesos, validaciones, alertas</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total eventos', value: totalHoy, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
              { label: 'Permitidos', value: permitidos, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
              { label: 'Denegados', value: denegados, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
              { label: 'Alertas', value: alertas, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
            ].map(stat => (
              <div key={stat.label} className={`p-4 rounded-xl border ${stat.bg}`}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por aula, método, motivo..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Result filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['all', 'SUCCESS', 'DENIED'] as FilterResult[]).map(r => (
                <button
                  key={r}
                  onClick={() => setFilterResult(r)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    filterResult === r ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r === 'all' ? 'Todos' : r === 'SUCCESS' ? 'Permitidos' : 'Denegados'}
                </button>
              ))}
            </div>

            {/* Method filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['all', 'FACE', 'PIN', 'MANUAL'] as FilterMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMethod(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    filterMethod === m ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'all' ? 'Método' : METHOD_LABEL[m]?.label}
                </button>
              ))}
            </div>

            {/* Alert toggle */}
            <button
              onClick={() => setShowAlertOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                showAlertOnly
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Solo alertas
            </button>
          </div>

          {/* Event list */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Filter className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay eventos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((evento: AccessEvent) => {
                const resultCfg = RESULT_CFG[evento.result] ?? RESULT_CFG.DENIED;
                const methodCfg = METHOD_LABEL[evento.method] ?? { label: evento.method, icon: null, color: '' };
                return (
                  <div
                    key={evento.id}
                    className={`rounded-xl border border-slate-200 p-3 flex items-center gap-4 ${resultCfg.rowBg} ${
                      evento.alert_flag ? 'ring-1 ring-amber-400' : ''
                    }`}
                  >
                    {/* Result icon */}
                    <div className="flex-shrink-0">{resultCfg.icon}</div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={resultCfg.badge} className="text-xs">
                          {resultCfg.label}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${methodCfg.color}`}>
                          {methodCfg.icon} {methodCfg.label}
                        </span>
                        {evento.alert_flag && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" /> Alerta
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">Aula: {evento.aula?.slice(0, 8) || '—'}</span>
                      </div>
                      {evento.reason && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{evento.reason}</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-slate-500">
                        {format(new Date(evento.timestamp), 'dd MMM HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
