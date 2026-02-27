'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { useEventos } from '@/lib/api-hooks';
import { Evento } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EventosPage() {
  const { data, isLoading } = useEventos();

  const eventos = data?.results || [];

  const handleExportCSV = () => {
    const headers = ['Fecha/Hora', 'Usuario', 'Aula', 'Método', 'Resultado', 'Motivo', 'Score'];
    const rows = eventos.map(e => [
      format(new Date(e.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es }),
      e.usuario_id,
      e.aula_id,
      e.metodo,
      e.resultado,
      e.motivo || '',
      e.score?.toFixed(2) || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eventos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  const columns = [
    {
      header: 'Fecha/Hora',
      accessor: (row: Evento) => (
        <div className="text-sm">
          {format(new Date(row.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es })}
        </div>
      ),
    },
    {
      header: 'Usuario',
      accessor: 'usuario_id' as keyof Evento,
      className: 'font-medium',
    },
    {
      header: 'Aula',
      accessor: 'aula_id' as keyof Evento,
    },
    {
      header: 'Método',
      accessor: (row: Evento) => (
        <Badge variant="outline">{row.metodo}</Badge>
      ),
    },
    {
      header: 'Resultado',
      accessor: (row: Evento) => (
        <Badge variant={row.resultado === 'permitido' ? 'default' : 'destructive'}>
          {row.resultado}
        </Badge>
      ),
    },
    {
      header: 'Score',
      accessor: (row: Evento) => (
        <div className="text-sm">{row.score ? `${(row.score * 100).toFixed(0)}%` : '-'}</div>
      ),
    },
    {
      header: 'Alerta',
      accessor: (row: Evento) => (
        row.alerta ? (
          <Badge variant="destructive">Sí</Badge>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      header: 'Motivo',
      accessor: (row: Evento) => (
        <div className="text-sm text-slate-600 max-w-xs truncate">
          {row.motivo || '-'}
        </div>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin', 'seguridad']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Eventos</h1>
              <p className="text-slate-600 mt-1">Registro de todos los intentos de acceso</p>
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <DataTable
            data={eventos}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar eventos..."
          />
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
