'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { useAlertas } from '@/lib/api-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AccessEvent } from '@/lib/types';

const metodLabel = (m: string) => ({ FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual' }[m] || m);
const resultLabel = (r: string) => ({ SUCCESS: 'Permitido', DENIED: 'Denegado' }[r] || r);

function AlertasList() {
  const { data: alertasData, isLoading: alertasLoading } = useAlertas();
  const alertas = alertasData?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Alertas de Seguridad</h1>
        <p className="text-slate-600 mt-1">Monitoreo de accesos denegados o comportamientos sospechosos</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle>Listado de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {alertasLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
            </div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay alertas recientes 🎉</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                  <tr>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3">Resultado</th>
                    <th className="px-4 py-3">Usuario (Ref)</th>
                    <th className="px-4 py-3">Motivo / Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertas.map((a: AccessEvent) => (
                    <tr key={a.id} className="hover:bg-red-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {format(new Date(a.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </td>
                      <td className="px-4 py-3">{metodLabel(a.method)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive">
                          {a.result === 'DENIED' ? 'ACCESO DENEGADO' : 'ALERTA'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-medium text-slate-900">{a.user_nombre || 'Desconocido'}</p>
                        {a.user_email && <p className="text-[10px] text-slate-400 font-mono">{a.user_email}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {a.reason || 'Sin detalle'}
                        {a.alert_flag && (
                          <span className="ml-2 text-xs text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full inline-block mt-1 sm:mt-0">
                            Flag Alerta
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AlertasPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <AlertasList />
      </AdminLayout>
    </RoleGuard>
  );
}
