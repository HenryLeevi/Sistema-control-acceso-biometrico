'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  usePermisos, useCreatePermiso, useUpdatePermiso, useDeletePermiso,
  useUsuarios, useAulas, useHorarios,
} from '@/lib/api-hooks';
import { AccessPermission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = { user: '', aula: '', schedule: '', is_active: true };

export default function PermisosPage() {
  const { data: permisosData, isLoading } = usePermisos();
  const { data: usuariosData } = useUsuarios();
  const { data: aulasData } = useAulas();
  const { data: horariosData } = useHorarios();
  const createPermiso = useCreatePermiso();
  const updatePermiso = useUpdatePermiso();
  const deletePermiso = useDeletePermiso();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccessPermission | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [itemToDelete, setItemToDelete] = useState<AccessPermission | null>(null);

  const permisos = permisosData?.results || [];
  const usuarios = usuariosData?.results || [];
  const aulas = aulasData?.results || [];
  const horarios = horariosData?.results || [];
  const isPending = createPermiso.isPending || updatePermiso.isPending;

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setIsDialogOpen(true); };
  const openEdit = (p: AccessPermission) => {
    setEditing(p);
    setFormData({ user: p.user, aula: p.aula, schedule: p.schedule, is_active: p.is_active });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user || !formData.aula || !formData.schedule) {
      toast({ title: 'Campos requeridos', description: 'Selecciona usuario, aula y horario', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updatePermiso.mutateAsync({ id: editing.id, data: formData });
        toast({ title: 'Permiso actualizado' });
      } else {
        await createPermiso.mutateAsync(formData);
        toast({ title: 'Permiso creado' });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el permiso', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deletePermiso.mutateAsync(itemToDelete.id);
      toast({ title: 'Permiso eliminado' });
      setItemToDelete(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: AccessPermission) => (
        <div>
          <p className="font-medium">{row.user_nombre || '—'}</p>
          <p className="text-xs text-slate-500">{row.user_email || row.user.slice(0, 8) + '...'}</p>
        </div>
      ),
    },
    {
      header: 'Aula',
      accessor: (row: AccessPermission) => (
        <div>
          <span className="font-mono font-semibold">{row.aula_code || '—'}</span>
          {row.aula_description && <p className="text-xs text-slate-500">{row.aula_description}</p>}
        </div>
      ),
    },
    {
      header: 'Horario',
      accessor: (row: AccessPermission) => (
        <span className="text-sm">{row.schedule_display || '—'}</span>
      ),
    },
    {
      header: 'Estado',
      accessor: (row: AccessPermission) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: AccessPermission) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-red-500" onClick={() => setItemToDelete(row)}>
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
              <h1 className="text-3xl font-bold text-slate-900">Permisos de Acceso</h1>
              <p className="text-slate-600 mt-1">Gestión de permisos usuario–aula–horario</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Permiso
            </Button>
          </div>

          <DataTable data={permisos} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar permisos..." />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Permiso' : 'Nuevo Permiso de Acceso'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Select value={formData.user} onValueChange={v => setFormData({ ...formData, user: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
                  <SelectContent>
                    {usuarios.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre} {u.apellido} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aula</Label>
                <Select value={formData.aula} onValueChange={v => setFormData({ ...formData, aula: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar aula..." /></SelectTrigger>
                  <SelectContent>
                    {aulas.filter(a => a.is_active).map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} — {a.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horario</Label>
                <Select value={formData.schedule} onValueChange={v => setFormData({ ...formData, schedule: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar horario..." /></SelectTrigger>
                  <SelectContent>
                    {horarios.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {DIAS[h.day_of_week]} {h.start_time.slice(0, 5)}–{h.end_time.slice(0, 5)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="perm_active" checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="perm_active">Permiso activo</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-slate-600">
                ¿Estás seguro de que deseas eliminar este permiso de acceso para <strong>{itemToDelete?.user_nombre || itemToDelete?.user_email}</strong>?
              </p>
              <p className="text-xs text-red-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deletePermiso.isPending}>
                {deletePermiso.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
