'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermisos, useCreatePermiso, useUsuarios, useAulas, useHorarios } from '@/lib/api-hooks';
import { Permiso } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export default function PermisosPage() {
  const { data: permisosData, isLoading: permisosLoading } = usePermisos();
  const { data: usuariosData } = useUsuarios();
  const { data: aulasData } = useAulas();
  const { data: horariosData } = useHorarios();
  const createPermiso = useCreatePermiso();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id: '',
    aula_id: '',
    horario_id: '',
    activo: true,
  });

  const permisos = permisosData?.results || [];
  const usuarios = usuariosData?.results || [];
  const aulas = aulasData?.results || [];
  const horarios = horariosData?.results || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPermiso.mutateAsync(formData);
      toast({ title: 'Permiso creado correctamente' });
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
      usuario_id: '',
      aula_id: '',
      horario_id: '',
      activo: true,
    });
  };

  const getUsuarioNombre = (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : id;
  };

  const getAulaCodigo = (id: string) => {
    const aula = aulas.find(a => a.id === id);
    return aula ? aula.codigo : id;
  };

  const getHorarioDescripcion = (id: string) => {
    const horario = horarios.find(h => h.id === id);
    return horario ? `${horario.hora_inicio} - ${horario.hora_fin}` : id;
  };

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: Permiso) => (
        <div className="font-medium">{getUsuarioNombre(row.usuario_id)}</div>
      ),
    },
    {
      header: 'Aula',
      accessor: (row: Permiso) => getAulaCodigo(row.aula_id),
    },
    {
      header: 'Horario',
      accessor: (row: Permiso) => getHorarioDescripcion(row.horario_id),
    },
    {
      header: 'Estado',
      accessor: (row: Permiso) => (
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
              <h1 className="text-3xl font-bold text-slate-900">Permisos</h1>
              <p className="text-slate-600 mt-1">Asignación de permisos de acceso</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Permiso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Permiso</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuario</Label>
                    <Select
                      value={formData.usuario_id}
                      onValueChange={(value) => setFormData({ ...formData, usuario_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios.map(usuario => (
                          <SelectItem key={usuario.id} value={usuario.id}>
                            {usuario.nombre} {usuario.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aula">Aula</Label>
                    <Select
                      value={formData.aula_id}
                      onValueChange={(value) => setFormData({ ...formData, aula_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar aula" />
                      </SelectTrigger>
                      <SelectContent>
                        {aulas.map(aula => (
                          <SelectItem key={aula.id} value={aula.id}>
                            {aula.codigo} - {aula.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario">Horario</Label>
                    <Select
                      value={formData.horario_id}
                      onValueChange={(value) => setFormData({ ...formData, horario_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar horario" />
                      </SelectTrigger>
                      <SelectContent>
                        {horarios.map(horario => (
                          <SelectItem key={horario.id} value={horario.id}>
                            {horario.descripcion || `${horario.hora_inicio} - ${horario.hora_fin}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="activo">Permiso activo</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createPermiso.isPending}>
                      {createPermiso.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            data={permisos}
            columns={columns}
            isLoading={permisosLoading}
            searchPlaceholder="Buscar permisos..."
          />
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
