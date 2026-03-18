'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAulas, useCreateAula } from '@/lib/api-hooks';
import { Aula } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export default function AulasPage() {
  const { data, isLoading } = useAulas();
  const createAula = useCreateAula();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    activo: true,
    capacidad: '',
    edificio: '',
  });

  const aulas = data?.results || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAula.mutateAsync({
        ...formData,
        capacidad: formData.capacidad ? parseInt(formData.capacidad) : undefined,
      });
      toast({ title: 'Aula creada correctamente' });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descripcion: '',
      activo: true,
      capacidad: '',
      edificio: '',
    });
  };

  const columns = [
    {
      header: 'Código',
      accessor: (row: Aula) => (
        <div className="font-medium">{row.codigo}</div>
      ),
    },
    {
      header: 'Descripción',
      accessor: 'descripcion' as keyof Aula,
    },
    {
      header: 'Edificio',
      accessor: (row: Aula) => row.edificio || '-',
    },
    {
      header: 'Capacidad',
      accessor: (row: Aula) => row.capacidad || '-',
    },
    {
      header: 'Estado',
      accessor: (row: Aula) => (
        <Badge variant={row.activo ? 'default' : 'secondary'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Aulas</h1>
              <p className="text-slate-600 mt-1">Gestión de aulas y espacios</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Aula
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Aula</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      placeholder="Ej: A-101"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      placeholder="Ej: Laboratorio de Computación"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edificio">Edificio</Label>
                      <Input
                        id="edificio"
                        placeholder="Ej: A"
                        value={formData.edificio}
                        onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacidad">Capacidad</Label>
                      <Input
                        id="capacidad"
                        type="number"
                        placeholder="30"
                        value={formData.capacidad}
                        onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="activo">Aula activa</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createAula.isPending}>
                      {createAula.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            data={aulas}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar aulas..."
          />
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
