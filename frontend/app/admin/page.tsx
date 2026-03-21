'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { KPICard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKPIData, useAlertas, useEventos, useUsuarios } from '@/lib/api-hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Activity, AlertTriangle, Users, ShieldAlert, UserX, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AccessEvent } from '@/lib/types';

// Helper: translate backend enum values to Spanish labels
const metodLabel = (m: string) => ({ FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual' }[m] || m);
const resultLabel = (r: string) => ({ SUCCESS: 'Permitido', DENIED: 'Denegado' }[r] || r);

// ------------------------
// Dashboard para Admin/Subadmin - vista completa con KPIs
// ------------------------
function AdminDashboard() {
  const { data: kpiData, isLoading: kpiLoading } = useKPIData();
  const { data: alertasData } = useAlertas();
  // alertas now returns AccessEvent[] with alert_flag=true
  const alertasRecientes = (alertasData?.results || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Resumen de actividad del sistema</p>
      </div>

      {kpiLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard title="Accesos Hoy" value={kpiData?.total_accesos_hoy || 0} icon={Activity} description="Total de intentos" />
          <KPICard title="Tasa de Éxito" value={`${kpiData?.tasa_exito.toFixed(1) || 0}%`} icon={CheckCircle} description="Accesos permitidos" />
          <KPICard title="Tasa de Rechazo" value={`${kpiData?.tasa_rechazo.toFixed(1) || 0}%`} icon={XCircle} description="Accesos denegados" />
          <KPICard title="Alertas Activas" value={kpiData?.alertas_activas || 0} icon={AlertTriangle} description="Requieren revisión" />
          <KPICard title="Usuarios Activos" value={kpiData?.usuarios_activos || 0} icon={Users} description="Con permisos vigentes" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Accesos por Hora</CardTitle></CardHeader>
          <CardContent>
            {kpiLoading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={kpiData?.accesos_por_hora || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Aulas</CardTitle></CardHeader>
          <CardContent>
            {kpiLoading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={kpiData?.top_aulas || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="aula" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#0f172a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alertas Recientes</CardTitle></CardHeader>
        <CardContent>
          {alertasRecientes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay alertas recientes</div>
          ) : (
            <div className="space-y-3">
              {alertasRecientes.map((alerta: AccessEvent) => (
                <div key={alerta.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {alerta.result === 'DENIED' ? 'ACCESO DENEGADO' : 'ALERTA'}
                      </p>
                      <p className="text-xs text-slate-500">{metodLabel(alerta.method)} · {alerta.reason || 'Sin detalle'}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">
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
// Dashboard para Seguridad - vista operativa sin KPIs analíticos
// ------------------------
function SeguridadDashboard() {
  const { data: alertasData, isLoading: alertasLoading } = useAlertas();
  const { data: eventosData, isLoading: eventosLoading } = useEventos();
  const { data: usuariosData } = useUsuarios();

  const alertas = alertasData?.results || [];
  const eventos = eventosData?.results || [];
  const usuarios = usuariosData?.results || [];

  const eventosDenegados = eventos.filter((e: AccessEvent) => e.result === 'DENIED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Panel de Seguridad</h1>
        <p className="text-slate-600 mt-1">Control operativo de accesos</p>
      </div>

      {/* Summary cards - operativas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-red-700 font-medium">Alertas Activas</p>
            <p className="text-3xl font-bold text-red-900">{alertas.length}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-700 font-medium">Accesos Denegados Hoy</p>
            <p className="text-3xl font-bold text-amber-900">{eventosDenegados.length}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <UserX className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Usuarios</p>
            <p className="text-3xl font-bold text-blue-900">{usuarios.length}</p>
          </div>
        </div>
      </div>

      {/* Alertas pendientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Alertas Pendientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {alertasLoading ? <Skeleton className="h-32" /> :
            alertas.length === 0 ? (
              <div className="text-center py-6 text-slate-500">Sin alertas pendientes ✓</div>
            ) : (
              <div className="space-y-2">
                {alertas.map((a: AccessEvent) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {a.result === 'DENIED' ? 'ACCESO DENEGADO' : 'ALERTA'}
                        </p>
                        <p className="text-xs text-slate-500">{metodLabel(a.method)} · {a.reason || ''}</p>
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

      {/* Últimos accesos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <CardTitle>Últimos Accesos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {eventosLoading ? <Skeleton className="h-32" /> : (
            <div className="space-y-2">
              {eventos.slice(0, 5).map((e: AccessEvent) => (
                <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      e.result === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {e.result === 'SUCCESS' ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Evento {e.method}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(e.timestamp), 'dd/MM HH:mm', { locale: es })} · {metodLabel(e.method)}
                      </p>
                    </div>
                  </div>
                  {e.alert_flag && <Badge variant="destructive" className="text-[10px]">Alerta</Badge>}
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
// Page principal con split por rol
// ------------------------
export default function AdminDashboardPage() {
  const { hasRole } = useAuth();
  const isOnlyBiometrico = hasRole('BIOMETRICO') && !hasRole('ADMIN') && !hasRole('SUBADMIN') && !hasRole('DOCENTE');
  const isDocente = hasRole('DOCENTE') && !hasRole('ADMIN') && !hasRole('SUBADMIN');

  // Docente tiene su propia vista importada como lazy redirect
  if (isDocente) {
    return <DocenteRedirect />;
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN', 'BIOMETRICO']}>
      <AdminLayout>
        {isOnlyBiometrico ? <SeguridadDashboard /> : <AdminDashboard />}
      </AdminLayout>
    </RoleGuard>
  );
}

function DocenteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/docente');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent mb-3" />
        <p className="text-sm text-slate-500">Cargando tu panel...</p>
      </div>
    </div>
  );
}
