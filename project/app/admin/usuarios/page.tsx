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
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useEnrolarBiometria } from '@/lib/api-hooks';
import { User, Role } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UsuariosPage() {
  const { data, isLoading } = useUsuarios();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const enrolarBiometria = useEnrolarBiometria();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBiometriaDialogOpen, setIsBiometriaDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre: '',
    apellido: '',
    activo: true,
    roles: ['docente'] as Role[],
  });
  const [biometriaFiles, setBiometriaFiles] = useState<FileList | null>(null);

  const usuarios = data?.results || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUsuario) {
        await updateUsuario.mutateAsync({
          id: selectedUsuario.id,
          data: formData,
        });
        toast({ title: 'Usuario actualizado correctamente' });
      } else {
        await createUsuario.mutateAsync(formData);
        toast({ title: 'Usuario creado correctamente' });
      }
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

  const handleEnrolarBiometria = async () => {
    if (!selectedUsuario || !biometriaFiles || biometriaFiles.length === 0) {
      toast({ title: 'Seleccione al menos una imagen', variant: 'destructive' });
      return;
    }

    try {
      const imagenes = Array.from(biometriaFiles);
      await enrolarBiometria.mutateAsync({
        usuarioId: selectedUsuario.id,
        imagenes,
      });
      toast({ title: 'Biometría enrolada correctamente' });
      setIsBiometriaDialogOpen(false);
      setSelectedUsuario(null);
      setBiometriaFiles(null);
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
      username: '',
      email: '',
      nombre: '',
      apellido: '',
      activo: true,
      roles: ['docente'],
    });
    setSelectedUsuario(null);
  };

  const handleEdit = (usuario: User) => {
    setSelectedUsuario(usuario);
    setFormData({
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      activo: usuario.activo,
      roles: usuario.roles,
    });
    setIsDialogOpen(true);
  };

  const handleBiometriaClick = (usuario: User) => {
    setSelectedUsuario(usuario);
    setIsBiometriaDialogOpen(true);
  };

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: User) => (
        <div>
          <div className="font-medium">{row.nombre} {row.apellido}</div>
          <div className="text-sm text-slate-500">@{row.username}</div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email' as keyof User,
    },
    {
      header: 'Roles',
      accessor: (row: User) => (
        <div className="flex gap-1">
          {row.roles.map(role => (
            <Badge key={role} variant="secondary">{role}</Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Biometría',
      accessor: (row: User) => (
        row.biometria_enrolada ? (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Enrolada
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      ),
    },
    {
      header: 'Estado',
      accessor: (row: User) => (
        <Badge variant={row.activo ? 'default' : 'secondary'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: User) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBiometriaClick(row)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Biometría
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Usuarios</h1>
              <p className="text-slate-600 mt-1">Gestión de usuarios del sistema</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol Principal</Label>
                    <Select
                      value={formData.roles[0]}
                      onValueChange={(value) => setFormData({ ...formData, roles: [value as Role] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="subadmin">Subadministrador</SelectItem>
                        <SelectItem value="docente">Docente</SelectItem>
                        <SelectItem value="seguridad">Seguridad</SelectItem>
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
                    <Label htmlFor="activo">Usuario activo</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUsuario.isPending || updateUsuario.isPending}>
                      {createUsuario.isPending || updateUsuario.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            data={usuarios}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar usuarios..."
          />

          <Dialog open={isBiometriaDialogOpen} onOpenChange={setIsBiometriaDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enrolar Biometría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Sube de 1 a 3 imágenes del rostro del usuario para enrolar su biometría.
                </p>
                {selectedUsuario && (
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="font-medium">{selectedUsuario.nombre} {selectedUsuario.apellido}</p>
                    <p className="text-sm text-slate-600">{selectedUsuario.email}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="imagenes">Imágenes (1-3 archivos)</Label>
                  <Input
                    id="imagenes"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setBiometriaFiles(e.target.files)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsBiometriaDialogOpen(false);
                      setSelectedUsuario(null);
                      setBiometriaFiles(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleEnrolarBiometria} disabled={enrolarBiometria.isPending}>
                    {enrolarBiometria.isPending ? 'Procesando...' : 'Enrolar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
