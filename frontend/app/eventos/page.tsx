'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { useEventos } from '@/lib/api-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AccessEvent } from '@/lib/types';

const metodLabel = (m: string) => ({ FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual' }[m] || m);
const resultLabel = (r: string) => ({ SUCCESS: 'Permitido', DENIED: 'Denegado' }[r] || r);

function EventosList() {
  const { data: eventosData, isLoading: eventosLoading } = useEventos();
  const eventos = eventosData?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Eventos de Acceso</h1>
        <p className="text-slate-600 mt-1">Historial completo de eventos registrados por los dispositivos biométricos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {eventosLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded" />)}
            </div>
          ) : eventos.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay eventos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                  <tr>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3">Resultado</th>
                    <th className="px-4 py-3">Usuario (Ref)</th>
                    <th className="px-4 py-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventos.map((e: AccessEvent) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {format(new Date(e.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </td>
                      <td className="px-4 py-3">{metodLabel(e.method)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={e.result === 'SUCCESS' ? 'default' : 'destructive'} className={e.result === 'SUCCESS' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {resultLabel(e.result)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {e.user ? e.user.substring(0, 8) + '...' : 'Desconocido'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{e.reason || 'Acceso regular'}</td>
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

export default function EventosPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <EventosList />
      </AdminLayout>
    </RoleGuard>
  );
}
