'use client';

import { useAlertas, useEventos, useUsuarios } from '@/lib/api-hooks';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, ShieldAlert, UserX, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AccessEvent } from '@/lib/types';

const metodLabel = (m: string) => ({ FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual' }[m] || m);
const resultLabel = (r: string) => ({ SUCCESS: 'Permitido', DENIED: 'Denegado' }[r] || r);

export default function BiometricoDashboardPage() {
  const { data: alertasData, isLoading: alertasLoading } = useAlertas();
  const { data: eventosData, isLoading: eventosLoading } = useEventos();
  const { data: usuariosData } = useUsuarios();

  const alertas = alertasData?.results || [];
  const eventos = eventosData?.results || [];
  const usuarios = usuariosData?.results || [];
  const eventosDenegados = eventos.filter((e: AccessEvent) => e.result === 'DENIED');

  return (
    <RoleGuard allowedRoles={['BIOMETRICO', 'ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Seguridad</h1>
            <p className="text-slate-600 mt-1">Control operativo de accesos — Rol Biométrico</p>
          </div>

          {/* Summary cards */}
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
                  {eventos.slice(0, 8).map((e: AccessEvent) => (
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
      </AdminLayout>
    </RoleGuard>
  );
}
