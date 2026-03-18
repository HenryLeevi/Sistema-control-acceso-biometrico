'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { KPICard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReporte } from '@/lib/api-hooks';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportesPage() {
  const { data: reporte, isLoading } = useReporte();

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
            <p className="text-slate-600 mt-1">Análisis y estadísticas del sistema</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  title="Total Accesos"
                  value={reporte?.total_accesos || 0}
                  icon={Activity}
                  description={reporte?.periodo || ''}
                />
                <KPICard
                  title="Accesos Permitidos"
                  value={reporte?.accesos_permitidos || 0}
                  icon={CheckCircle}
                />
                <KPICard
                  title="Accesos Denegados"
                  value={reporte?.accesos_denegados || 0}
                  icon={XCircle}
                />
                <KPICard
                  title="Tasa Puntualidad"
                  value={`${reporte?.tasa_puntualidad.toFixed(1) || 0}%`}
                  icon={TrendingUp}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Accesos por Día</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={reporte?.accesos_por_dia || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="permitidos" stroke="#0f172a" name="Permitidos" />
                        <Line type="monotone" dataKey="denegados" stroke="#ef4444" name="Denegados" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accesos por Método</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reporte?.accesos_por_metodo || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metodo" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#0f172a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Usuarios Más Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reporte?.usuarios_mas_activos || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="usuario" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#0f172a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mapa de Calor (Día vs Hora)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600">
                    Visualización de patrones de acceso por día y hora
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                      <div key={dia} className="text-center text-xs font-medium text-slate-600">
                        {dia}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    {reporte?.heatmap.length || 0} puntos de datos registrados
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
