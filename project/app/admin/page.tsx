'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { KPICard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKPIData, useAlertas } from '@/lib/api-hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Activity, AlertTriangle, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { data: kpiData, isLoading: kpiLoading } = useKPIData();
  const { data: alertasData } = useAlertas();

  const alertasRecientes = alertasData?.results.slice(0, 5) || [];

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin', 'seguridad']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Resumen de actividad del sistema</p>
          </div>

          {kpiLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <KPICard
                title="Accesos Hoy"
                value={kpiData?.total_accesos_hoy || 0}
                icon={Activity}
                description="Total de intentos"
              />
              <KPICard
                title="Tasa de Éxito"
                value={`${kpiData?.tasa_exito.toFixed(1) || 0}%`}
                icon={CheckCircle}
                description="Accesos permitidos"
              />
              <KPICard
                title="Tasa de Rechazo"
                value={`${kpiData?.tasa_rechazo.toFixed(1) || 0}%`}
                icon={XCircle}
                description="Accesos denegados"
              />
              <KPICard
                title="Alertas Activas"
                value={kpiData?.alertas_activas || 0}
                icon={AlertTriangle}
                description="Requieren revisión"
              />
              <KPICard
                title="Usuarios Activos"
                value={kpiData?.usuarios_activos || 0}
                icon={Users}
                description="Con permisos vigentes"
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Accesos por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={kpiData?.accesos_por_hora || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#0f172a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Aulas</CardTitle>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={kpiData?.top_aulas || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="aula" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#0f172a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {alertasRecientes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay alertas recientes
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasRecientes.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div>
                          <p className="font-medium text-sm text-slate-900">
                            {alerta.tipo.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-500">Evento #{alerta.evento_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={alerta.prioridad === 'alta' ? 'destructive' : 'secondary'}>
                          {alerta.prioridad}
                        </Badge>
                        <Badge variant={alerta.estado === 'nueva' ? 'default' : 'outline'}>
                          {alerta.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
