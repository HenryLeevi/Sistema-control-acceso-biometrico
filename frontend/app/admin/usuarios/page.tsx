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
  useEnrolarBiometria, useCreatePinContingency, useBiometrics, useDeleteBiometric,
} from '@/lib/api-hooks';
import { WebcamCapture } from '@/components/webcam-capture';
import { User, AppRole, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, Shield, X, Eye, EyeOff, Copy, RefreshCw, Fingerprint, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  username: '', password: '', email: '', nombre: '', apellido: '', dui: '', residencia: '', pin: '', is_active: true,
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
  const createPin = useCreatePinContingency();
  const { toast } = useToast();

  // Track which user's roles we want to load for the edit dialog
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const { data: userRolesData } = useUserRoles(editingUserId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [bioFiles, setBioFiles] = useState<File[]>([]);
  const [bioPreviews, setBioPreviews] = useState<string[]>([]);
  const [selectedForBio, setSelectedForBio] = useState<User | null>(null);
  const { data: biometricsData } = useBiometrics(selectedForBio?.id);
  const deleteBiometric = useDeleteBiometric();
  const [pendingRoleToAdd, setPendingRoleToAdd] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Clear editing state when dialog closes to force the role fetch effect to run again when re-opened
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingUserId(undefined);
    }
  }, [isDialogOpen]);

  // Clean up blob URLs when bio dialog closes
  useEffect(() => {
    if (!isBioDialogOpen) {
      bioPreviews.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      setBioPreviews([]);
      setBioFiles([]);
    }
  }, [isBioDialogOpen]);

  // Load existing biometric photo into previews
  useEffect(() => {
    if (isBioDialogOpen && biometricsData?.results?.length) {
      const activeBio = biometricsData.results[0];
      if (activeBio.storage_url) {
        setBioPreviews([activeBio.storage_url]);
      }
    }
  }, [isBioDialogOpen, biometricsData]);

  const handleFileChange = (files: FileList | File[] | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setBioFiles(newFiles);
    
    // Revoke old blob previews
    bioPreviews.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    
    // Create new previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setBioPreviews(newPreviews);
  };

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
      residencia: u.residencia || '',
      pin: '', // Pin is always write-only
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
      delete payload.pin; // Do not send pin to user endpoint
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

      // Handle PIN Assignment
      if (formData.pin) {
        try {
          const expires = new Date();
          expires.setFullYear(expires.getFullYear() + 10);
          await createPin.mutateAsync({
            user: savedUser.id,
            pin_hash: formData.pin,
            expires_at: expires.toISOString(),
            is_active: true
          });
        } catch (pinErr) {
          console.error("Error asignando PIN:", pinErr);
          toast({ title: 'Aviso (PIN falló)', description: 'Usuario guardado, pero falló el PIN.', variant: 'destructive' });
        }
      }

      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo guardar', variant: 'destructive' });
    }
  };

  const handleGeneratePin = () => {
    // Generate 6 random digits from 1 to 6 as requested
    let newPin;
    const currentPin = formData.pin;
    do {
      newPin = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1).join('');
    } while (newPin === currentPin);
    
    setFormData({ ...formData, pin: newPin });
    toast({ title: 'PIN Generado', description: `Nuevo PIN: ${newPin}` });
  };

  const handleCopyPin = () => {
    if (!formData.pin) return;
    navigator.clipboard.writeText(formData.pin);
    toast({ title: 'Copiado', description: 'PIN copiado al portapapeles' });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUsuario.mutateAsync(userToDelete.id);
      toast({ title: 'Usuario eliminado' });
      setUserToDelete(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const handleBio = async () => {
    if (!selectedForBio) return;
    
    // Check if we are deleting the existing one and not adding new ones
    const hasExistingInPreviews = bioPreviews.some(url => url.startsWith('http'));
    const activeBioRecord = biometricsData?.results?.[0];

    try {
      if (bioFiles.length > 0) {
        // Standard enrollment (replaces previous one automatically in backend)
        await enrolarBiometria.mutateAsync({ usuarioId: selectedForBio.id, imagenes: bioFiles });
        toast({ title: 'Biometría enrolada correctamente' });
      } else if (!hasExistingInPreviews && activeBioRecord) {
        // Manual deletion of the only existing photo
        await deleteBiometric.mutateAsync(activeBioRecord.id);
        toast({ title: 'Biometría eliminada del sistema y AWS' });
      }
      
      setIsBioDialogOpen(false);
    } catch {
      toast({ title: 'Error al procesar biometría', variant: 'destructive' });
    }
  };

  const removeBioFile = (index: number) => {
    const newFiles = [...bioFiles];
    newFiles.splice(index, 1);
    setBioFiles(newFiles);

    const newPreviews = [...bioPreviews];
    const url = newPreviews[index];
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    newPreviews.splice(index, 1);
    setBioPreviews(newPreviews);
  };

  const togglePendingRole = (roleName: string) => {
    // Single-role selection: clicking the same role deselects it
    setPendingRoleToAdd(prev => (prev === roleName ? '' : roleName));
  };

  const columns = [
    {
      header: 'Usuario',
      accessor: (row: User) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100 shadow-sm shrink-0">
            {`${row.nombre[0] || ''}${row.apellido[0] || ''}`.toUpperCase() || <Users className="h-4 w-4" />}
          </div>
          <div className="overflow-hidden text-left">
            <p className="font-bold text-slate-900 truncate">{row.nombre} {row.apellido}</p>
            <p className="text-[10px] text-slate-500 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'DUI', accessor: (row: User) => (<span className="font-mono font-medium">{row.dui || '—'}</span>) },
    {
      header: 'Enrolado',
      accessor: (row: User) => (
        <Badge variant="outline" className={cn("font-bold gap-1.5 shadow-none", row.is_enrolled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")}>
          <div className={cn("h-2 w-2 rounded-full", row.is_enrolled ? 'bg-emerald-500' : 'bg-red-500')} />
          {row.is_enrolled ? 'SÍ' : 'NO'}
        </Badge>
      ),
    },
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
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 transition-colors" onClick={() => { setSelectedForBio(row); setIsBioDialogOpen(true); }}>
            <Fingerprint className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 transition-colors" onClick={() => setUserToDelete(row)}>
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
              <h1 className="text-3xl font-bold text-slate-900">Usuarios</h1>
              <p className="text-slate-600 mt-1">Gestión de usuarios del sistema</p>
            </div>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Usuario
            </Button>
          </div>

          <DataTable data={usuarios} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar usuarios..." />
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Apellido</Label>
                  <Input value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Input 
                  placeholder="00000000-0" 
                  value={formData.dui} 
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, ''); // Solo números
                    if (val.length > 8) {
                      val = val.slice(0, 8) + '-' + val.slice(8, 9);
                    }
                    setFormData({ ...formData, dui: val });
                  }} 
                  maxLength={10}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Residencia</Label>
                  <Input 
                    placeholder="Ej: San Salvador" 
                    value={formData.residencia} 
                    onChange={e => setFormData({ ...formData, residencia: e.target.value })} 
                  />
                </div>
                <div className="space-y-1">
                  <Label>PIN (Biométrico)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Ej: 1234" 
                        value={formData.pin} 
                        onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} 
                        maxLength={8}
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
                    <Button type="button" variant="outline" size="icon" onClick={handleGeneratePin} title="Generar PIN">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyPin} disabled={!formData.pin} title="Copiar PIN">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {editing && <p className="text-xs text-slate-400">Dejar vacío para mantener el actual</p>}
                </div>
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold mb-2 block text-center">Imágenes del rostro</Label>
                  
                  <div className="flex flex-col items-center gap-4">
                    {/* Stylized Upload Button */}
                    <label 
                      htmlFor="bio-upload"
                      className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl p-8 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
                    >
                      <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-bold text-indigo-700">Presiona para elegir archivos</span>
                      <p className="text-xs text-indigo-500 mt-1">Recomendado: 3 fotos de frente</p>
                      <input 
                        id="bio-upload"
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden"
                        onChange={e => handleFileChange(e.target.files)} 
                      />
                    </label>

                    {/* Previews Grid */}
                    {bioPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {bioPreviews.map((url, idx) => {
                          const isExisting = url.startsWith('http');
                          return (
                            <div key={url} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100 group/thumb">
                              <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                              {isExisting && (
                                <div className="absolute inset-x-0 bottom-0 bg-indigo-600/80 text-white text-[10px] font-bold text-center py-0.5">
                                  FOTO ACTUAL
                                </div>
                              )}
                              <button 
                                onClick={() => removeBioFile(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="relative text-center text-xs font-medium text-slate-500 py-2">
                  <span className="bg-white px-2 relative z-10">O usar cámara web</span>
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                </div>

                <WebcamCapture onSave={(files) => handleFileChange(files)} maxPhotos={3} />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsBioDialogOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={handleBio} 
                  disabled={
                    enrolarBiometria.isPending || 
                    deleteBiometric.isPending ||
                    (bioFiles.length === 0 && bioPreviews.length === (biometricsData?.results?.[0]?.storage_url ? 1 : 0))
                  }
                >
                  {enrolarBiometria.isPending || deleteBiometric.isPending ? 'Procesando...' : 'Guardar Biometría'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.nombre} {userToDelete?.apellido}</strong>?
            </p>
            <p className="text-xs text-red-500 mt-2">Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteUsuario.isPending}>
              {deleteUsuario.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
    </RoleGuard>
  );
}
