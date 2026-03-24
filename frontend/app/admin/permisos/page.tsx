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
import { Plus, Pencil, Trash2, Users, MapPin, Calendar, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { cn, formatTimeAMPM } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 shadow-sm shrink-0">
            {row.user_nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <Users className="h-4 w-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-slate-900 truncate">{row.user_nombre || '—'}</p>
            <p className="text-[10px] text-slate-500 truncate">{row.user_email || row.user.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Aula / Ubicación',
      accessor: (row: AccessPermission) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-mono font-bold text-slate-900">{row.aula_code || '—'}</span>
            {row.aula_description && <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{row.aula_description}</p>}
          </div>
        </div>
      ),
    },
    {
      header: 'Ventana de Horario',
      accessor: (row: AccessPermission) => (
        <div className="flex items-center gap-2">
          {row.schedule_is_anytime ? (
            <Badge className="bg-slate-900 shadow-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
              Acceso Permanente
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                <span className="font-bold mr-1">{row.schedule_display?.split(' ')[0]}</span>
                {(row.schedule_start || '').slice(0, 5)} – {(row.schedule_end || '').slice(0, 5)}
              </span>
            </div>
          )}
        </div>
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
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 transition-colors" onClick={() => setItemToDelete(row)}>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Permisos de Acceso</h1>
              <p className="text-slate-600 mt-1">Vinculación de usuarios con aulas y horarios</p>
            </div>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Permiso
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-900 rounded-lg">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Permisos</p>
                  <p className="text-2xl font-black text-slate-800">{permisos.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-900 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Docentes con Acceso</p>
                  <p className="text-2xl font-black text-slate-800">{new Set(permisos.map(p => p.user)).size}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-900 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aulas Gestionadas</p>
                  <p className="text-2xl font-black text-slate-800">{new Set(permisos.map(p => p.aula)).size}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <DataTable data={permisos} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar permisos..." />
          </div>
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
                        {h.is_anytime
                          ? 'Acceso Total'
                          : `${DIAS[h.day_of_week ?? 0]} ${(h.start_time || '').slice(0, 5)}–${(h.end_time || '').slice(0, 5)}`}
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
