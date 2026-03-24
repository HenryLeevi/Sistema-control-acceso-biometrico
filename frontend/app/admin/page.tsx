'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { KPICard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKPIData, useAlertas, useEventos, useUsuarios, usePermissions } from '@/lib/api-hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Activity, AlertTriangle, Users, ShieldAlert, UserX, Clock, LayoutDashboard, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AccessEvent, AccessPermission } from '@/lib/types';
import { DynamicChart } from '@/components/dynamic-chart';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const metodLabel = (m: string) => ({ FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual' }[m] || m);
const resultLabel = (r: string) => ({ SUCCESS: 'Permitido', DENIED: 'Denegado' }[r] || r);

const WIDGET_OPTIONS = [
  { id: 'accesos_hoy', label: 'Accesos Hoy', icon: Activity },
  { id: 'tasa_exito', label: 'Tasa de Éxito', icon: CheckCircle },
  { id: 'tasa_rechazo', label: 'Tasa de Rechazo', icon: XCircle },
  { id: 'top_aulas', label: 'Top Aulas', icon: UserX },
  { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'falsos_negativos', label: 'Falsos Neg.', icon: ShieldAlert },
  { id: 'uso_otp', icon: Clock, label: 'Uso OTP' },
  { id: 'score_promedio', icon: Activity, label: 'Score Prom.' },
  { id: 'tiempo_respuesta', icon: Clock, label: 'T. Respuesta' },
  { id: 'accesos_por_metodo', label: 'Por Método', icon: LayoutDashboard },
];

interface WidgetConfig {
  id: string;
  size: 'sm' | 'md' | 'lg';
}

const DASHBOARD_COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Slate', value: '#64748b', bg: 'bg-slate-600' },
];

function AdminDashboard() {
  const { data: alertasData } = useAlertas();
  const alertasRecientes = (alertasData?.results || []).slice(0, 5);

  const [activeWidgets, setActiveWidgets] = useState<WidgetConfig[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'classic' | 'interactive'>('classic');
  const [dashboardColor, setDashboardColor] = useState('#3b82f6');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');

  // KPI Data hook with filters
  const kpiFilters = dateRange ? { start_date: dateRange.start, end_date: dateRange.end } : undefined;
  const { data: kpiData, isLoading: kpiLoading } = useKPIData(kpiFilters);
  const { data: permissionsData } = usePermissions();
  const permissions = permissionsData?.results || [];

  const [isLoaded, setIsLoaded] = useState(false);

  const handlePeriodChange = (p: 'today' | 'week' | 'month' | 'year') => {
    setPeriod(p);
    const end = new Date();
    let start = new Date();
    
    if (p === 'today') {
      setDateRange(null); // Backend defaults to today if null
      return;
    } else if (p === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (p === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (p === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    }
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  useEffect(() => {
    try {
      const savedWidgets = localStorage.getItem('dashboard_widgets_v2');
      if (savedWidgets) setActiveWidgets(JSON.parse(savedWidgets));
      const savedMode = localStorage.getItem('dashboard_mode');
      if (savedMode === 'classic' || savedMode === 'interactive') setDashboardMode(savedMode);
      const savedColor = localStorage.getItem('dashboard_color');
      if (savedColor) setDashboardColor(savedColor);
    } catch(e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('dashboard_widgets_v2', JSON.stringify(activeWidgets));
      localStorage.setItem('dashboard_mode', dashboardMode);
      localStorage.setItem('dashboard_color', dashboardColor);
    }
  }, [activeWidgets, dashboardMode, dashboardColor, isLoaded]);

  const addWidget = (type: string) => {
    if (type && !activeWidgets.find(w => w.id === type)) {
      setActiveWidgets((prev) => [...prev, { id: type, size: 'sm' }]);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('widgetType', id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('widgetType');
    addWidget(type);
  };

  const removeWidget = (id: string) => {
    setActiveWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const resizeWidget = (id: string, newSize: 'sm' | 'md' | 'lg') => {
    setActiveWidgets((prev) => prev.map(w => w.id === id ? { ...w, size: newSize } : w));
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="h-[400px] w-full rounded-xl flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-slate-600" />
        </div>
      </div>
    );
  }

  const activeIds = activeWidgets.map(w => w.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard de Control</h1>
          <p className="text-slate-600 mt-1">
            {dashboardMode === 'classic' ? 'Resumen de actividad del sistema' : 'Personaliza tu espacio de trabajo arrastrando y redimensionando'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm gap-1">
            {(['today', 'week', 'month', 'year', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => p === 'custom' ? setPeriod('custom') : handlePeriodChange(p)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all uppercase tracking-wider",
                  period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : p === 'year' ? 'Año' : 'Personalizado'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
              <input 
                type="date" 
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={dateRange?.start || ''}
                onChange={(e) => setDateRange(prev => ({ start: e.target.value, end: prev?.end || '' }))}
              />
              <span className="text-slate-400 text-xs font-bold">a</span>
              <input 
                type="date" 
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={dateRange?.end || ''}
                onChange={(e) => setDateRange(prev => ({ start: prev?.start || '', end: e.target.value }))}
              />
            </div>
          )}

          {dashboardMode === 'interactive' && (
            <div className="hidden lg:flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              {DASHBOARD_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setDashboardColor(c.value)}
                  className={cn(
                    "h-6 w-6 rounded-md transition-all",
                    c.bg,
                    dashboardColor === c.value ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-80 hover:opacity-100"
                  )}
                  title={`Tema ${c.name}`}
                />
              ))}
            </div>
          )}
        </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto shadow-sm">
            <button 
              onClick={() => setDashboardMode('classic')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", dashboardMode === 'classic' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              Clásico
            </button>
            <button 
              onClick={() => setDashboardMode('interactive')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", dashboardMode === 'interactive' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              Interactivo
            </button>
          </div>
        </div>
      </div>

      {dashboardMode === 'interactive' ? (
        <>
          {kpiLoading ? (
            <div className="flex gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-32 rounded-full" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
              {WIDGET_OPTIONS.map((widget) => {
                const Icon = widget.icon;
                const isActive = activeIds.includes(widget.id);
                return (
                  <div
                    key={widget.id}
                    draggable={!isActive}
                    onDragStart={(e) => handleDragStart(e, widget.id)}
                    onClick={() => addWidget(widget.id)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-full border text-sm font-medium transition-all group",
                      isActive 
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing shadow-sm"
                    )}
                    style={!isActive ? { borderLeftColor: dashboardColor, borderLeftWidth: '3px' } : {}}
                  >
                    {!isActive && <Plus className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 transition-colors mr-1" />}
                    <Icon className="h-4 w-4" style={!isActive ? { color: dashboardColor } : {}} />
                    <span>{widget.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div 
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              "min-h-[500px] p-6 rounded-2xl border-2 transition-all duration-300",
              activeWidgets.length === 0 
                ? "border-dashed border-slate-300 bg-slate-50 flex items-center justify-center"
                : "border-solid border-transparent bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min"
            )}
          >
            {activeWidgets.length === 0 ? (
              <div className="text-center text-slate-400 pointer-events-none">
                <LayoutDashboard className="h-16 w-16 mx-auto mb-4 opacity-20 text-slate-500" />
                <p className="text-xl font-bold text-slate-500">Lienzo Vacío</p>
                <p className="text-sm mt-1">Arrastra o toca las etiquetas superiores para armar tu Dashboard</p>
              </div>
            ) : (
              activeWidgets.map((widget) => (
                <div 
                  key={widget.id} 
                  className={cn(
                    "animate-in fade-in zoom-in duration-300 h-fit",
                    widget.size === 'md' ? "lg:col-span-2" : widget.size === 'lg' ? "lg:col-span-3 md:col-span-2" : "col-span-1"
                  )}
                >
                  <DynamicChart 
                    type={widget.id} 
                    data={kpiData} 
                    onRemove={() => removeWidget(widget.id)} 
                    primaryColor={dashboardColor}
                    size={widget.size}
                    onResize={(newSize) => resizeWidget(widget.id, newSize)}
                  />
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {kpiLoading ? (
            <div className="grid gap-1 sm:gap-4 grid-cols-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 lg:h-32" />)}
            </div>
          ) : (
            <div className="grid gap-1 sm:gap-4 grid-cols-4">
              <KPICard title="Accesos Totales" value={kpiData?.total_accesos || 0} icon={Activity} description="En el periodo seleccionado" trend={kpiData?.total_accesos_trend} />
              <KPICard title="Tasa Éxito" value={`${kpiData?.tasa_exito || 0}%`} icon={CheckCircle} description="Permitidos" trend={kpiData?.tasa_exito_trend} />
              <KPICard title="Tasa Rechazo" value={`${kpiData?.tasa_rechazo || 0}%`} icon={XCircle} description="Denegados" trend={kpiData?.tasa_rechazo_trend} />
              <KPICard title="Alertas" value={kpiData?.alertas_activas || 0} icon={AlertTriangle} description="Requieren revisión" className={kpiData?.alertas_activas ? "bg-red-50 ring-1 ring-red-100" : ""} trend={kpiData?.alertas_activas_trend} />
              <KPICard title="Falsos Negativos" value={kpiData?.falsos_negativos || 0} icon={ShieldAlert} description="Fallos biométricos" trend={kpiData?.falsos_negativos_trend} />
              <KPICard title="Uso OTP" value={kpiData?.uso_otp || 0} icon={Clock} description="Accesos vía código" trend={kpiData?.uso_otp_trend} />
              <KPICard title="Score Promedio" value={`${kpiData?.score_promedio || 0}%`} icon={Activity} description="Confianza facial" trend={kpiData?.score_promedio_trend} />
              <KPICard title="Tiempo Respuesta" value={`${kpiData?.tiempo_respuesta_promedio || 0}s`} icon={Clock} description="Promedio latencia" trend={kpiData?.tiempo_respuesta_trend} />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3 mt-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700">Flujo Temporal</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {kpiLoading ? <Skeleton className="h-64" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={kpiData?.accesos_por_hora || kpiData?.accesos_por_dia || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="hora" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="cantidad" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700">Accesos por Método</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {kpiLoading ? <Skeleton className="h-64" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={kpiData?.accesos_por_metodo || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="metodo" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} tickFormatter={metodLabel} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="cantidad" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700">Top Aulas (Accesos)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {kpiLoading ? <Skeleton className="h-64" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={kpiData?.top_aulas || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="aula" type="category" width={80} fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="cantidad" fill="#1e293b" radius={[0, 4, 4, 0]} />
                    </BarChart> 
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alertas Recientes</CardTitle>
          <Button variant="ghost" size="sm">Ver todas</Button>
        </CardHeader>
        <CardContent>
          {alertasRecientes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay alertas recientes</div>
          ) : (
            <div className="space-y-3">
              {alertasRecientes.map((alerta: AccessEvent) => (
                <div key={alerta.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={cn("h-2 w-2 rounded-full", alerta.result === 'DENIED' ? "bg-red-500" : "bg-amber-500")} />
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {alerta.result === 'DENIED' ? 'ACCESO DENEGADO' : 'ALERTA DE SISTEMA'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {metodLabel(alerta.method)} · {alerta.aula_code} · {alerta.reason || 'S/D'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alerta.result === 'DENIED' ? "destructive" : "outline"} className={alerta.result === 'DENIED' ? "" : "bg-amber-50 text-amber-700 border-amber-200"}>
                    {resultLabel(alerta.result)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------
// Dashboard para Seguridad - vista operativa optimizada
// ------------------------
function SeguridadDashboard() {
  const { data: alertasData, isLoading: alertasLoading } = useAlertas();
  const { data: eventosData, isLoading: eventosLoading } = useEventos();
  const { data: usuariosData } = useUsuarios();

  const alertas = alertasData?.results || [];
  const eventos = (eventosData?.results || []).slice(0, 5);
  const usuarios = usuariosData?.results || [];

  const eventosDenegados = (eventosData?.results || []).filter((e: AccessEvent) => e.result === 'DENIED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Panel de Seguridad</h1>
        <p className="text-slate-600 mt-1">Monitoreo de accesos en tiempo real</p>
      </div>

      <div className="grid gap-1 sm:gap-4 grid-cols-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-red-700 font-medium uppercase tracking-wider text-[10px]">Alertas Activas</p>
            <p className="text-3xl font-bold text-red-900">{alertas.length}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-700 font-medium uppercase tracking-wider text-[10px]">Denegados Hoy</p>
            <p className="text-3xl font-bold text-amber-900">{eventosDenegados.length}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium uppercase tracking-wider text-[10px]">Usuarios</p>
            <p className="text-3xl font-bold text-blue-900">{usuarios.length}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Alertas Pendientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {alertasLoading ? <Skeleton className="h-32" /> :
            alertas.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic">Sin alertas pendientes ✓</div>
            ) : (
              <div className="space-y-2">
                {alertas.map((a: AccessEvent) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg group hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {a.result === 'DENIED' ? 'ALERTA DE ACCESO' : 'ALERTA'}
                        </p>
                        <p className="text-xs text-slate-500">{metodLabel(a.method)} · {a.aula_code} · {a.reason || 'Sin motivo'}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{resultLabel(a.result)}</Badge>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">Últimos Accesos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {eventosLoading ? <Skeleton className="h-32" /> : (
            <div className="space-y-2">
              {eventos.map((e: AccessEvent) => (
                <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
                      e.result === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
                    )}>
                      {e.result === 'SUCCESS' ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Validación {metodLabel(e.method)}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(e.timestamp), 'dd/MM HH:mm', { locale: es })} · {e.aula_code}
                      </p>
                    </div>
                  </div>
                  {e.score && <Badge variant="outline" className="text-[10px] bg-slate-50">Score: {e.score.toFixed(1)}%</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { hasRole } = useAuth();
  const isOnlyBiometrico = hasRole('BIOMETRICO') && !hasRole('ADMIN') && !hasRole('SUBADMIN') && !hasRole('DOCENTE');

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN', 'BIOMETRICO']}>
      <AdminLayout>
        {isOnlyBiometrico ? <SeguridadDashboard /> : <AdminDashboard />}
      </AdminLayout>
    </RoleGuard>
  );
}


