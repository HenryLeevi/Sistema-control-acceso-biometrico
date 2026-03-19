'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAulas, useCreateAula, useUpdateAula, useDeleteAula } from '@/lib/api-hooks';
import { Aula } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = { code: '', description: '', is_active: true };

export default function AulasPage() {
  const { data, isLoading } = useAulas();
  const createAula = useCreateAula();
  const updateAula = useUpdateAula();
  const deleteAula = useDeleteAula();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Aula | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const aulas = data?.results || [];
  const isPending = createAula.isPending || updateAula.isPending;

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setIsDialogOpen(true); };
  const openEdit = (aula: Aula) => {
    setEditing(aula);
    setFormData({ code: aula.code, description: aula.description, is_active: aula.is_active });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateAula.mutateAsync({ id: editing.id, data: formData });
        toast({ title: 'Aula actualizada' });
      } else {
        await createAula.mutateAsync(formData);
        toast({ title: 'Aula creada' });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el aula', variant: 'destructive' });
    }
  };

  const handleDelete = async (aula: Aula) => {
    if (!confirm(`¿Eliminar el aula ${aula.code}?`)) return;
    try {
      await deleteAula.mutateAsync(aula.id);
      toast({ title: 'Aula eliminada' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const columns = [
    {
      header: 'Código',
      accessor: (row: Aula) => <span className="font-mono font-semibold">{row.code}</span>,
    },
    {
      header: 'Descripción',
      accessor: (row: Aula) => row.description || '—',
    },
    {
      header: 'Estado puerta',
      accessor: (row: Aula) => (
        <Badge variant={row.actual_state === 'OPEN' ? 'default' : 'secondary'}>
          {row.actual_state === 'OPEN' ? 'Abierta' : 'Cerrada'}
        </Badge>
      ),
    },
    {
      header: 'Activa',
      accessor: (row: Aula) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Sí' : 'No'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: Aula) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Aulas</h1>
              <p className="text-slate-600 mt-1">Gestión de aulas y espacios controlados</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Nueva Aula
            </Button>
          </div>

          <DataTable data={aulas} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar aulas..." />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Aula' : 'Nueva Aula'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input placeholder="Ej: A-101" value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input placeholder="Ej: Laboratorio de Computación" value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="is_active">Aula activa</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
