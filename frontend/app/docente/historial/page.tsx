'use client';

import { useAuth } from '@/lib/auth-context';
import { useEventos } from '@/lib/api-hooks';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistorialDocentePage() {
  const { user } = useAuth();
  
  // Use local_user_id for filtering
  const { data: eventosData, isLoading } = useEventos(
    user?.local_user_id 
      ? { user: user.local_user_id, ordering: '-timestamp' } 
      : undefined
  );

  const eventos = eventosData?.results || [];

  return (
    <RoleGuard allowedRoles={['DOCENTE']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mi Historial de Acceso</h1>
              <p className="text-slate-500 mt-1">
                Consulta todos tus intentos de entrada a las aulas asignadas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                Total: {eventosData?.count || 0} registros
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-500" />
                  Registros Recientes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : eventos.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No se encontraron registros</p>
                  <p className="text-sm">Tus intentos de acceso aparecerán aquí una vez que utilices el sistema biográfico.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Aula</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventos.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{new Date(ev.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(ev.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">{ev.aula_code || '---'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {ev.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ev.result === 'SUCCESS' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-green-700">Permitido</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium text-red-700">Denegado</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                          {ev.reason || (ev.result === 'SUCCESS' ? 'Validación correcta' : 'Sin motivo especificado')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
