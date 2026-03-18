'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEventos } from '@/lib/api-hooks';
import { Evento } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Search, Filter, Scan, Key, User, AlertCircle } from 'lucide-react';

const METODO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  facial:  { label: 'Facial',  color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: Scan },
  otp:     { label: 'OTP',     color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Key },
  manual:  { label: 'Manual',  color: 'bg-slate-100 text-slate-700 border-slate-200',  icon: User },
};

export default function EventosPage() {
  const { data, isLoading } = useEventos();
  const [search, setSearch] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState<string[]>([]);
  const [filtroResultado, setFiltroResultado] = useState<string>('todos');

  const eventos = data?.results || [];

  const filtrados = eventos.filter(e => {
    const texto = `${e.usuario_id} ${e.aula_id} ${e.metodo} ${e.resultado}`.toLowerCase();
    const searchOk = !search || texto.includes(search.toLowerCase());
    const metodoOk = filtroMetodo.length === 0 || filtroMetodo.includes(e.metodo);
    const resultadoOk = filtroResultado === 'todos' || e.resultado === filtroResultado;
    return searchOk && metodoOk && resultadoOk;
  });

  const handleExportCSV = () => {
    const headers = ['Fecha/Hora', 'Usuario', 'Aula', 'Método', 'Resultado', 'Motivo', 'Score'];
    const rows = eventos.map(e => [
      format(new Date(e.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es }),
      e.usuario_id,
      e.aula_id,
      e.metodo,
      e.resultado,
      e.motivo || '',
      e.score?.toFixed(2) || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eventos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  const toggleMetodo = (m: string) => {
    setFiltroMetodo(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  // Summary stats
  const totalPermitidos = eventos.filter(e => e.resultado === 'permitido').length;
  const totalDenegados = eventos.filter(e => e.resultado === 'denegado').length;
  const totalConAlerta = eventos.filter(e => e.alerta).length;

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin', 'seguridad']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Eventos</h1>
              <p className="text-slate-600 mt-1">Registro de todos los intentos de acceso</p>
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-800">{totalPermitidos}</p>
              <p className="text-xs text-green-600 mt-0.5 font-medium">Permitidos</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-800">{totalDenegados}</p>
              <p className="text-xs text-red-600 mt-0.5 font-medium">Denegados</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-800">{totalConAlerta}</p>
              <p className="text-xs text-amber-600 mt-0.5 font-medium">Con Alerta</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por usuario, aula, método..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> Método:</span>
              {Object.entries(METODO_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => toggleMetodo(key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      filtroMetodo.includes(key) ? cfg.color : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Resultado:</span>
              {['todos', 'permitido', 'denegado'].map(r => (
                <button
                  key={r}
                  onClick={() => setFiltroResultado(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                    filtroResultado === r
                      ? r === 'permitido' ? 'bg-green-100 text-green-700 border-green-300'
                      : r === 'denegado' ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {r === 'todos' ? 'Todos' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Events list */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Search className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No hay eventos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtrados.map((evento) => {
                const cfg = METODO_CONFIG[evento.metodo] || METODO_CONFIG.manual;
                const Icon = cfg.icon;
                return (
                  <div
                    key={evento.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border bg-white transition-all hover:shadow-sm ${
                      evento.alerta ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                    }`}
                  >
                    {/* Result indicator */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white ${
                      evento.resultado === 'permitido' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {evento.resultado === 'permitido' ? '✓' : '✗'}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          Usuario #{evento.usuario_id}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="text-sm font-medium text-slate-700">Aula #{evento.aula_id}</span>
                        {evento.score && (
                          <span className="text-xs text-slate-400">Score: {(evento.score * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {format(new Date(evento.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                        {evento.motivo && (
                          <span className="text-xs text-slate-500 truncate">· {evento.motivo}</span>
                        )}
                      </div>
                    </div>

                    {/* Right badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </div>
                      {evento.alerta && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <AlertCircle className="h-3 w-3" /> Alerta
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-slate-400 text-right">{filtrados.length} de {eventos.length} eventos</p>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
