'use client';

import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { useAlertas } from '@/lib/api-hooks';
import { Alerta } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export default function AlertasPage() {
  const { data, isLoading } = useAlertas();

  const alertas = data?.results || [];

  const getPrioridadVariant = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const columns = [
    {
      header: 'Evento',
      accessor: (row: Alerta) => (
        <div className="font-medium">#{row.evento_id}</div>
      ),
    },
    {
      header: 'Tipo',
      accessor: (row: Alerta) => (
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm">{row.tipo.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      header: 'Prioridad',
      accessor: (row: Alerta) => (
        <Badge variant={getPrioridadVariant(row.prioridad)}>
          {row.prioridad}
        </Badge>
      ),
    },
    {
      header: 'Estado',
      accessor: (row: Alerta) => (
        <Badge variant={row.estado === 'nueva' ? 'default' : 'outline'}>
          {row.estado}
        </Badge>
      ),
    },
    {
      header: 'Revisada por',
      accessor: (row: Alerta) => (
        <div className="text-sm text-slate-600">
          {row.revisada_por || '-'}
        </div>
      ),
    },
    {
      header: 'Notas',
      accessor: (row: Alerta) => (
        <div className="text-sm text-slate-600 max-w-xs truncate">
          {row.notas || '-'}
        </div>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin', 'seguridad']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Alertas</h1>
            <p className="text-slate-600 mt-1">Eventos marcados que requieren atención</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium">Alertas Nuevas</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {alertas.filter(a => a.estado === 'nueva').length}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-600 font-medium">En Revisión</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">
                {alertas.filter(a => a.estado === 'revisada').length}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Resueltas</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {alertas.filter(a => a.estado === 'resuelta').length}
              </div>
            </div>
          </div>

          <DataTable
            data={alertas}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar alertas..."
          />
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
