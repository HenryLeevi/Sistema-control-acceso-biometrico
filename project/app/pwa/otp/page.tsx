'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGenerarOTP } from '@/lib/api-hooks';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, Clock } from 'lucide-react';

export default function PWAOTPPage() {
  const router = useRouter();
  const { toast } = useToast();
  const generarOTP = useGenerarOTP();

  const [codigo, setCodigo] = useState<string | null>(null);
  const [expiraEn, setExpiraEn] = useState<Date | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number>(0);

  useEffect(() => {
    handleGenerarCodigo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!expiraEn) return;

    const interval = setInterval(() => {
      const ahora = new Date();
      const diferencia = Math.floor((expiraEn.getTime() - ahora.getTime()) / 1000);

      if (diferencia <= 0) {
        setTiempoRestante(0);
        clearInterval(interval);
      } else {
        setTiempoRestante(diferencia);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiraEn]);

  const handleGenerarCodigo = async () => {
    try {
      const resultado = await generarOTP.mutateAsync();
      setCodigo(resultado.codigo);
      setExpiraEn(new Date(resultado.expira_en));
      toast({
        title: 'Código generado',
        description: 'Muestra este código al personal de seguridad',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el código',
        variant: 'destructive',
      });
    }
  };

  const formatTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (tiempoRestante > 180) return 'bg-green-500';
    if (tiempoRestante > 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const progressPercentage = expiraEn ? (tiempoRestante / 300) * 100 : 0;

  return (
    <RoleGuard allowedRoles={['docente', 'admin', 'subadmin', 'seguridad']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <header className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pwa/home')}
            className="text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Button>
        </header>

        <main className="max-w-md mx-auto px-4 pb-8">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Código de Acceso</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Muestra este código al personal de seguridad
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {codigo ? (
                <>
                  <div className="bg-slate-900 rounded-2xl p-8 text-center">
                    <div className="text-6xl font-bold text-white tracking-wider">
                      {codigo}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>Tiempo restante</span>
                      </div>
                      <span className="font-mono font-bold text-lg">
                        {formatTiempo(tiempoRestante)}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor()} transition-all duration-1000`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {tiempoRestante === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-600 font-medium">Código expirado</p>
                      <p className="text-xs text-red-500 mt-1">
                        Genera un nuevo código para continuar
                      </p>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleGenerarCodigo}
                    disabled={generarOTP.isPending}
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    {generarOTP.isPending ? 'Generando...' : 'Generar Nuevo Código'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                  <p className="mt-4 text-sm text-slate-600">Generando código...</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 space-y-2">
                <p className="font-medium">Instrucciones:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>El código es válido por 5 minutos</li>
                  <li>Solo puede usarse una vez</li>
                  <li>Muéstralo al personal en la entrada</li>
                  <li>Regenera si expira</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </RoleGuard>
  );
}
