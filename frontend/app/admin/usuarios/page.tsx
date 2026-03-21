'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario,
  useRoles, useUserRoles, useCreateUserRole, useDeleteUserRole,
  useEnrolarBiometria,
} from '@/lib/api-hooks';
import { User, AppRole, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Shield, X, Eye, EyeOff } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SUBADMIN: 'Sub-Administrador',
  DOCENTE: 'Docente',
  BIOMETRICO: 'Biométrico',
};

const ROLE_COLORS: Record<string, string> = {
  BIOMETRICO: 'bg-green-100 text-green-700',
};

const emptyForm = {
  username: '', password: '', email: '', nombre: '', apellido: '', dui: '', is_active: true,
};

export default function UsuariosPage() {
  const { data, isLoading } = useUsuarios();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();
  const enrolarBiometria = useEnrolarBiometria();
  const { data: rolesData } = useRoles();
  const createUserRole = useCreateUserRole();
  const deleteUserRole = useDeleteUserRole();
  const { toast } = useToast();

  // Track which user's roles we want to load for the edit dialog
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const { data: userRolesData } = useUserRoles(editingUserId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [bioFiles, setBioFiles] = useState<FileList | null>(null);
  const [selectedForBio, setSelectedForBio] = useState<User | null>(null);
  const [pendingRoleToAdd, setPendingRoleToAdd] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear editing state when dialog closes to force the role fetch effect to run again when re-opened
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingUserId(undefined);
    }
  }, [isDialogOpen]);

  const usuarios = data?.results || [];
  const roles = rolesData?.results || [];
  const isPending = createUsuario.isPending || updateUsuario.isPending;

  // Pre-select the current role when editing a user
  useEffect(() => {
    console.log("Edit Effect Triggered", { editingUserId, userRolesData });
    // Only try to set the role if we are editing a user and the data has loaded
    if (editingUserId && userRolesData?.results) {
      const firstAssignment = userRolesData.results[0];
      console.log("First assignment:", firstAssignment);
      if (firstAssignment?.role_code) {
        setPendingRoleToAdd(firstAssignment.role_code);
      } else if (firstAssignment?.role) {
        // Fallback: if role_code isn't populated for some reason, we can find it in roles array
        const matchedRole = roles.find(r => r.id === firstAssignment.role);
        if (matchedRole) setPendingRoleToAdd(matchedRole.name);
      }
    }
  }, [userRolesData, editingUserId, roles]);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setPendingRoleToAdd('');
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setEditingUserId(u.id);
    setFormData({
      username: u.username || '',
      password: '',
      email: u.email,
      nombre: u.nombre,
      apellido: u.apellido,
      dui: u.dui || '',
      is_active: u.is_active,
    });
    setPendingRoleToAdd(''); // will be overwritten by useEffect once userRoles loads
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: role is required when creating a new user
    if (!editing && !pendingRoleToAdd) {
      toast({
        title: 'Rol requerido',
        description: 'Debes asignar un rol al usuario antes de crearlo.',
        variant: 'destructive',
      });
      return;
    }

    // Validate DUI format if provided
    const duiValue = formData.dui.trim();
    if (duiValue && !/^\d{8}-\d$/.test(duiValue)) {
      toast({
        title: 'Formato de DUI incorrecto',
        description: 'El DUI debe tener el formato: 00000000-0 (8 dígitos, guión, 1 dígito). Ejemplo: 12345678-9',
        variant: 'destructive',
      });
      return;
    }

    // Validate email uniqueness against already-loaded users
    const emailNormalizado = formData.email.trim().toLowerCase();
    const emailDuplicado = usuarios.some(
      u => u.email.toLowerCase() === emailNormalizado && u.id !== editing?.id
    );
    if (emailDuplicado) {
      toast({
        title: 'Correo ya registrado',
        description: `El email "${formData.email.trim()}" ya está en uso por otro usuario.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      let savedUser: User;

      // Build payload — strip empty strings for write-only fields on edit
      const payload: Record<string, unknown> = { ...formData };
      if (!payload.username) delete payload.username;
      if (!payload.password) delete payload.password;

      if (editing) {
        savedUser = await updateUsuario.mutateAsync({ id: editing.id, data: payload as Partial<User> });
        toast({ title: 'Usuario actualizado' });
      } else {
        savedUser = await createUsuario.mutateAsync(payload as Partial<User>);
        toast({ title: 'Usuario creado' });
      }

      // Handle Role updates!
      if (pendingRoleToAdd) {
        const newRoleObj = roles.find(r => r.name === pendingRoleToAdd);
        if (newRoleObj) {
          try {
            if (editing && userRolesData?.results?.length) {
              const currentAssignment = userRolesData.results[0];
              // If the role changed, delete the old one first
              if (currentAssignment.role_code !== pendingRoleToAdd) {
                await deleteUserRole.mutateAsync(currentAssignment.id);
                await createUserRole.mutateAsync({ user: savedUser.id, role: newRoleObj.id });
              }
            } else {
              // Creating new user or user had no role
              await createUserRole.mutateAsync({ user: savedUser.id, role: newRoleObj.id });
            }
          } catch (roleErr) {
            console.error("Error asignando rol:", roleErr);
            const msg = roleErr instanceof Error ? roleErr.message : String(roleErr);
            toast({ title: 'Aviso (Rol falló)', description: `Usuario guardado, pero falló el rol: ${msg}`, variant: 'destructive' });
          }
        }
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo guardar', variant: 'destructive' });
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`¿Eliminar usuario ${u.nombre} ${u.apellido}?`)) return;
    try {
      await deleteUsuario.mutateAsync(u.id);
      toast({ title: 'Usuario eliminado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const handleBio = async () => {
    if (!selectedForBio || !bioFiles?.length) {
      toast({ title: 'Selecciona al menos una imagen', variant: 'destructive' });
      return;
    }
    try {
      await enrolarBiometria.mutateAsync({ usuarioId: selectedForBio.id, imagenes: Array.from(bioFiles) });
      toast({ title: 'Biometría enrolada correctamente' });
      setIsBioDialogOpen(false);
    } catch {
      toast({ title: 'Error al enrolar biometría', variant: 'destructive' });
    }
  };

  const togglePendingRole = (roleName: string) => {
    // Single-role selection: clicking the same role deselects it
    setPendingRoleToAdd(prev => (prev === roleName ? '' : roleName));
  };

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: User) => (
        <div>
          <p className="font-medium">{row.nombre} {row.apellido}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    { header: 'DUI', accessor: (row: User) => row.dui || '—' },
    {
      header: 'Estado',
      accessor: (row: User) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: User) => (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setSelectedForBio(row); setIsBioDialogOpen(true); }}>
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row)}>
            <Trash2 className="h-3.5 w-3.5" />
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
              <h1 className="text-3xl font-bold text-slate-900">Usuarios</h1>
              <p className="text-slate-600 mt-1">Gestión de usuarios del sistema</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Usuario
            </Button>
          </div>

          <DataTable data={usuarios} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar usuarios..." />
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Apellido</Label>
                  <Input value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Usuario (login)</Label>
                  <Input
                    placeholder="Ej: jperez"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required={!editing}
                  />
                  {editing && <p className="text-xs text-slate-400">Dejar vacío para no cambiar</p>}
                </div>
                <div className="space-y-1">
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editing ? '••••••••' : 'Contraseña'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required={!editing}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {editing && <p className="text-xs text-slate-400">Dejar vacío para no cambiar</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>DUI (00000000-0)</Label>
                <Input placeholder="00000000-0" value={formData.dui} onChange={e => setFormData({ ...formData, dui: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="usr_active" checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="usr_active">Usuario activo</Label>
              </div>

              {/* Role assignment — single role only */}
              <div className="space-y-2 border-t pt-3">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Shield className="h-4 w-4" /> Asignar rol
                  {!editing && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {['ADMIN', 'SUBADMIN', 'DOCENTE', 'BIOMETRICO'].map(roleName => {
                    const selected = pendingRoleToAdd === roleName;
                    return (
                      <button
                        key={roleName}
                        type="button"
                        onClick={() => togglePendingRole(roleName)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? ROLE_COLORS[roleName] + ' border-current'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {selected && <span className="mr-1">✓</span>}
                        {ROLE_LABELS[roleName]}
                      </button>
                    );
                  })}
                </div>
                {pendingRoleToAdd ? (
                  <p className="text-xs text-slate-500">
                    Rol seleccionado: <span className="font-medium">{ROLE_LABELS[pendingRoleToAdd]}</span>
                  </p>
                ) : !editing ? (
                  <p className="text-xs text-red-400">Selecciona un rol para continuar.</p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Biometría Dialog */}
        <Dialog open={isBioDialogOpen} onOpenChange={setIsBioDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enrolar Biometría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedForBio && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium">{selectedForBio.nombre} {selectedForBio.apellido}</p>
                  <p className="text-sm text-slate-500">{selectedForBio.email}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label>Imágenes del rostro (1–3 archivos)</Label>
                <Input type="file" accept="image/*" multiple onChange={e => setBioFiles(e.target.files)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBioDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleBio} disabled={enrolarBiometria.isPending}>
                  {enrolarBiometria.isPending ? 'Procesando...' : 'Enrolar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
