'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEventos } from '@/lib/api-hooks';
import { AccessEvent } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const metodLabel = (m: string) => ({ FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual' }[m] || m);
const resultLabel = (r: string) => ({ SUCCESS: 'Permitido', DENIED: 'Denegado' }[r] || r);

export default function PWAHistorialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useEventos();

  const eventos = data?.results.filter((e: AccessEvent) => e.user === user?.id).slice(0, 20) || [];

  return (
    <RoleGuard allowedRoles={['DOCENTE', 'ADMIN', 'SUBADMIN', 'BIOMETRICO']}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center max-w-md mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/docente/home')}
              className="text-white mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Mi Historial de Accesos</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto p-4 space-y-4">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : eventos.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No hay accesos registrados</p>
                <p className="text-sm text-slate-500 mt-1">
                  Tus intentos de acceso aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            eventos.map((evento: AccessEvent) => (
              <Card key={evento.id} className="shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {evento.result === 'SUCCESS' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <Badge variant={evento.result === 'SUCCESS' ? 'default' : 'destructive'}>
                          {resultLabel(evento.result)}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Aula:</span>
                          <span className="font-medium">{evento.aula}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Método:</span>
                          <Badge variant="outline" className="text-xs">
                            {metodLabel(evento.method)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Fecha:</span>
                          <span className="text-xs">
                            {format(new Date(evento.timestamp), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>

                      {evento.reason && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-600">
                            <span className="font-medium">Motivo:</span> {evento.reason}
                          </p>
                        </div>
                      )}

                      {evento.alert_flag && (
                        <div className="mt-2">
                          <Badge variant="destructive" className="text-xs">
                            Alerta generada
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </main>
      </div>
    </RoleGuard>
  );
}
