'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  useKPIData, 
  useUsuarios, 
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
  useEnrolarBiometria, 
  useAlertas, 
  useEventos, 
  useReporte,
  useBiometrics,
  useDeleteBiometric,
  useRoles,
  useUserRoles,
  useCreateUserRole,
  useDeleteUserRole,
  useAulas,
  useCreateAula,
  useUpdateAula,
  useDeleteAula,
  useHorarios,
  usePermisos,
  useCreatePermiso,
  useUpdatePermiso,
  useDeletePermiso,
  useCreateHorario,
  useUpdateHorario,
  useDeleteHorario,
  useExportarEventos
} from '@/lib/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, CheckCircle, XCircle, AlertTriangle, Users, 
  Phone, Upload, FileText, Download, Clock, Shield, Search, X, Calendar as CalendarIcon, Plus, Filter, RefreshCw, DoorOpen,
  Eye, EyeOff, Copy, Pencil, Trash2, Key
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, addDays, startOfDay, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, AccessEvent, Aula, Schedule, AccessPermission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { KPICard } from '@/components/kpi-card';
import { DataTable } from '@/components/data-table';
import { WebcamCapture } from '@/components/webcam-capture';
import { useAuth } from '@/lib/auth-context';
import { formatTimeAMPM } from '@/lib/utils';

const SOPORTE_TELEFONO = '+503 71112300';
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

const ROLE_LABELS: Record<string, string> = {
  DOCENTE: 'Docente',
  BIOMETRICO: 'Biométrico',
};

const ROLE_COLORS: Record<string, string> = {
  DOCENTE: 'bg-blue-100 text-blue-700',
  BIOMETRICO: 'bg-emerald-100 text-emerald-700',
};

export default function SubAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- Dashboard Data ---
  const { data: kpiData, isLoading: kpiLoading } = useKPIData();
  const { data: alertasData } = useAlertas();
  const alertas = alertasData?.results || [];

  // --- User Management States ---
  const { data: usuariosData, isLoading: usuariosLoading } = useUsuarios();
  const usuarios = useMemo(() => {
    return (usuariosData?.results || []).filter(u => 
      u.roles?.some(r => r === 'DOCENTE' || r === 'BIOMETRICO')
    );
  }, [usuariosData]);
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedForBio, setSelectedForBio] = useState<User | null>(null);
  const [bioFiles, setBioFiles] = useState<File[]>([]);
  const [bioPreviews, setBioPreviews] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingRoleToAdd, setPendingRoleToAdd] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const { data: userRolesData } = useUserRoles(editingUserId);
  const [formPin, setFormPin] = useState('');
  const [formDui, setFormDui] = useState('');
  
  const enrolarBiometria = useEnrolarBiometria();
  const { data: biometricsData } = useBiometrics(selectedForBio?.id);
  const deleteBiometric = useDeleteBiometric();
  const { hasRole } = useAuth();
  
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();
  const { data: rolesData } = useRoles();
  const createUserRole = useCreateUserRole();
  const roles = rolesData?.results || [];

  // --- Monitoring Data ---
  const [eventFilters, setEventFilters] = useState<Record<string, string>>({});
  const { data: eventosData, isLoading: eventosLoading } = useEventos(eventFilters);
  const eventos = eventosData?.results || [];

  // --- Reports Data ---
  const [reportDates, setReportDates] = useState({ 
    start_date: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd') 
  });
  const { data: reporteData, isLoading: reporteLoading } = useReporte(reportDates);
  const exportarEventos = useExportarEventos();

  // --- Schedules & Permissions ---
  const { data: aulasData, isLoading: aulasLoading } = useAulas();
  const createAula = useCreateAula();
  const updateAula = useUpdateAula();
  const deleteAula = useDeleteAula();
  const { data: permisosData, isLoading: permisosLoading, refetch: refetchPermisos } = usePermisos();
  const updatePermiso = useUpdatePermiso();
  const deletePermiso = useDeletePermiso();
  const { data: horariosData, isLoading: horariosLoading } = useHorarios();
  const createHorario = useCreateHorario();
  const updateHorario = useUpdateHorario();
  const deleteHorario = useDeleteHorario();
  const createPermiso = useCreatePermiso();
  const queryClient = useQueryClient();
  
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number, hour: number } | null>(null);
  const [newPermiso, setNewPermiso] = useState({ user: '', aula: '', duration: 1 });

  // --- Schedule CRUD States ---
  const [isScheduleCRUDDialogOpen, setIsScheduleCRUDDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({ day_of_week: '0', start_time: '07:00', end_time: '08:00', is_anytime: false });
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);

  // --- Aula CRUD States ---
  const [isAulaCRUDDialogOpen, setIsAulaCRUDDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [aulaFormData, setAulaFormData] = useState({ code: '', description: '', is_active: true });
  const [aulaToDelete, setAulaToDelete] = useState<Aula | null>(null);

  // --- Permiso CRUD States ---
  const [isPermisoCRUDDialogOpen, setIsPermisoCRUDDialogOpen] = useState(false);
  const [editingPermiso, setEditingPermiso] = useState<AccessPermission | null>(null);
  const [permisoFormData, setPermisoFormData] = useState({ user: '', aula: '', schedule: '', is_active: true });
  const [permisoToDelete, setPermisoToDelete] = useState<AccessPermission | null>(null);

  // --- Delete confirmation state ---
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Enrollment Helpers
  useEffect(() => {
    if (!isBioDialogOpen) {
      bioPreviews.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
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

  useEffect(() => {
    if (!isUserDialogOpen) {
      setEditingUser(null);
      setEditingUserId(undefined);
      setPendingRoleToAdd('');
      setFormPin('');
      setFormDui('');
      setShowPassword(false);
    }
  }, [isUserDialogOpen]);

  // Pre-select the current role when editing a user
  useEffect(() => {
    if (editingUserId && userRolesData?.results?.length) {
      const firstAssignment = userRolesData.results[0];
      if (firstAssignment?.role_code) {
        setPendingRoleToAdd(firstAssignment.role_code);
      }
    }
  }, [userRolesData, editingUserId]);


  const handleFileChange = (files: FileList | File[] | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setBioFiles(newFiles);
    bioPreviews.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setBioPreviews(newPreviews);
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

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditingUserId(user.id);
    setFormPin('');
    setFormDui(user.dui || '');
    setIsUserDialogOpen(true);
  };

  const handleBioSubmit = async () => {
    if (!selectedForBio) return;
    
    const hasExistingInPreviews = bioPreviews.some(url => url.startsWith('http'));
    const activeBioRecord = biometricsData?.results?.[0];

    try {
      if (bioFiles.length > 0) {
        await enrolarBiometria.mutateAsync({ usuarioId: selectedForBio.id, imagenes: bioFiles });
        toast({ title: 'Biometría enrolada correctamente' });
      } else if (!hasExistingInPreviews && activeBioRecord) {
        await deleteBiometric.mutateAsync(activeBioRecord.id);
        toast({ title: 'Biometría eliminada' });
      }
      setIsBioDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al procesar biometría', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {
      nombre: formData.get('nombre') as string,
      apellido: formData.get('apellido') as string,
      email: formData.get('email') as string,
      dui: formDui || null,
      residencia: (formData.get('residencia') as string) || '',
      is_active: formData.get('is_active') === 'true',
    };
    if (formData.get('password')) payload.password = formData.get('password');
    if (formData.get('username')) payload.username = formData.get('username');
    if (formPin) payload.pin = formPin;

    try {
      if (editingUser) {
        await updateUsuario.mutateAsync({ id: editingUser.id, data: payload as User });
        toast({ title: 'Usuario actualizado exitosamente' });
      } else {
        const newUser = await createUsuario.mutateAsync(payload as User);
        if (pendingRoleToAdd) {
          const role = roles.find(r => r.name === pendingRoleToAdd);
          if (role) {
            await createUserRole.mutateAsync({ user: newUser.id, role: role.id });
            // FORCE REFRESH: Since we filter the list by roles, we must 
            // wait for the role to be linked before the user appears.
            await queryClient.invalidateQueries({ queryKey: ['usuarios'] });
          }
        }
        toast({ title: 'Usuario creado exitosamente' });
      }
      setIsUserDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    }
  };

  const handleGeneratePin = () => {
    const newPin = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1).join('');
    setFormPin(newPin);
    toast({ title: 'PIN Generado', description: `Nuevo PIN: ${newPin}` });
  };

  const handleCopyPin = () => {
    if (!formPin) return;
    navigator.clipboard.writeText(formPin);
    toast({ title: 'Copiado', description: 'PIN copiado al portapapeles' });
  };

  const togglePendingRole = (roleName: string) => {
    setPendingRoleToAdd(prev => (prev === roleName ? '' : roleName));
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUsuario.mutateAsync(userToDelete.id);
      toast({ title: 'Usuario eliminado' });
      setUserToDelete(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // --- Schedule Handlers ---
  const openCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleFormData({ day_of_week: '0', start_time: '07:00', end_time: '08:00', is_anytime: false });
    setIsScheduleCRUDDialogOpen(true);
  };

  const openEditSchedule = (s: Schedule) => {
    setEditingSchedule(s);
    setScheduleFormData({
      day_of_week: s.day_of_week !== null ? String(s.day_of_week) : '0',
      start_time: s.start_time ? s.start_time.slice(0, 5) : '07:00',
      end_time: s.end_time ? s.end_time.slice(0, 5) : '08:00',
      is_anytime: !!s.is_anytime
    });
    setIsScheduleCRUDDialogOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { day_of_week: scheduleFormData.is_anytime ? null : parseInt(scheduleFormData.day_of_week), start_time: scheduleFormData.is_anytime ? null : scheduleFormData.start_time, end_time: scheduleFormData.is_anytime ? null : scheduleFormData.end_time, is_anytime: scheduleFormData.is_anytime };
    try {
      if (editingSchedule) { await updateHorario.mutateAsync({ id: editingSchedule.id, data: payload as any }); toast({ title: 'Horario actualizado' }); } 
      else { await createHorario.mutateAsync(payload as any); toast({ title: 'Horario creado' }); }
      setIsScheduleCRUDDialogOpen(false);
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    try { await deleteHorario.mutateAsync(scheduleToDelete.id); toast({ title: 'Horario eliminado' }); setScheduleToDelete(null); } 
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  // --- Aula Handlers ---
  const openCreateAula = () => { setEditingAula(null); setAulaFormData({ code: '', description: '', is_active: true }); setIsAulaCRUDDialogOpen(true); };
  const openEditAula = (aula: Aula) => { setEditingAula(aula); setAulaFormData({ code: aula.code, description: aula.description, is_active: aula.is_active }); setIsAulaCRUDDialogOpen(true); };
  const handleSaveAula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAula) { await updateAula.mutateAsync({ id: editingAula.id, data: aulaFormData }); toast({ title: 'Aula actualizada' }); } 
      else { await createAula.mutateAsync(aulaFormData); toast({ title: 'Aula creada' }); }
      setIsAulaCRUDDialogOpen(false);
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };
  const confirmDeleteAula = async () => {
    if (!aulaToDelete) return;
    try { await deleteAula.mutateAsync(aulaToDelete.id); toast({ title: 'Aula eliminada' }); setAulaToDelete(null); } 
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  // --- Permiso Handlers ---
  const openCreatePermiso = () => { setEditingPermiso(null); setPermisoFormData({ user: '', aula: '', schedule: '', is_active: true }); setIsPermisoCRUDDialogOpen(true); };
  const openEditPermiso = (p: AccessPermission) => { setEditingPermiso(p); setPermisoFormData({ user: p.user, aula: p.aula, schedule: p.schedule, is_active: p.is_active }); setIsPermisoCRUDDialogOpen(true); };
  const handleSavePermiso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permisoFormData.user || !permisoFormData.aula || !permisoFormData.schedule) { toast({ title: 'Faltan datos', description: 'Selecciona usuario, aula y horario', variant: 'destructive' }); return; }
    try {
      if (editingPermiso) { await updatePermiso.mutateAsync({ id: editingPermiso.id, data: permisoFormData }); toast({ title: 'Permiso actualizado' }); } 
      else { await createPermiso.mutateAsync(permisoFormData); toast({ title: 'Permiso creado' }); }
      setIsPermisoCRUDDialogOpen(false);
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };
  const confirmDeletePermiso = async () => {
    if (!permisoToDelete) return;
    try { await deletePermiso.mutateAsync(permisoToDelete.id); toast({ title: 'Permiso eliminado' }); setPermisoToDelete(null); } 
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleCreateAppointment = async () => {
    if (!selectedSlot || !newPermiso.user || !newPermiso.aula) return;
    try {
      const start_time = `${selectedSlot.hour.toString().padStart(2, '0')}:00:00`;
      const end_time = `${(selectedSlot.hour + newPermiso.duration).toString().padStart(2, '0')}:00:00`;
      const sched = await createHorario.mutateAsync({ day_of_week: selectedSlot.day, start_time, end_time, is_anytime: false });
      await createPermiso.mutateAsync({ user: newPermiso.user, aula: newPermiso.aula, schedule: sched.id, is_active: true });
      toast({ title: 'Horario asignado exitosamente' }); setIsClassDialogOpen(false);
    } catch (err: any) { toast({ title: 'Error en asignación', description: err.message, variant: 'destructive' }); }
  };

  // --- Columns ---
  const userColumns = [{
    header: 'Usuario',
    accessor: (row: User) => (<div><p className="font-medium text-slate-900">{row.nombre} {row.apellido}</p><p className="text-xs text-slate-500">{row.email}</p></div>),
  }, { header: 'DUI', accessor: (row: User) => row.dui || '—' }, {
    header: 'Enrolado',
    accessor: (row: User) => (<Badge variant="outline" className={row.is_enrolled ? "bg-emerald-50 text-emerald-700 font-bold gap-1.5" : "bg-red-50 text-red-700 font-bold gap-1.5"}><div className={`h-2 w-2 rounded-full ${row.is_enrolled ? 'bg-emerald-500' : 'bg-red-500'}`} />{row.is_enrolled ? 'SÍ' : 'NO'}</Badge>),
  }, {
    header: 'Estado',
    accessor: (row: User) => (<Badge variant={row.is_active ? 'default' : 'secondary'}>{row.is_active ? 'Activo' : 'Inactivo'}</Badge>),
  }, {
    header: 'Acciones',
    accessor: (row: User) => {
      const isAdminOrSub = row.roles?.some(r => r === 'ADMIN' || r === 'SUBADMIN');
      const canEdit = hasRole('ADMIN') || !isAdminOrSub;
      return (<div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => openEdit(row)} disabled={!canEdit}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={() => { setSelectedForBio(row); setIsBioDialogOpen(true); }}><Upload className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={() => setUserToDelete(row)} disabled={!canEdit} className="text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>);
    },
  }];

  const scheduleColumns = [{ header: 'Día', accessor: (row: Schedule) => (<span className="font-bold text-slate-700">{row.is_anytime ? <span className="text-indigo-600">Acceso Total</span> : DIAS_SEMANA[row.day_of_week || 0]}</span>) }, { header: 'Hora', accessor: (row: Schedule) => (<span className="font-mono text-xs">{row.is_anytime ? '--:--' : `${formatTimeAMPM(row.start_time || '')} — ${formatTimeAMPM(row.end_time || '')}`}</span>) }, { header: 'Acciones', accessor: (row: Schedule) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEditSchedule(row)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setScheduleToDelete(row)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></div>) }];
  const aulaColumns = [{ header: 'Código', accessor: (row: Aula) => <span className="font-mono font-semibold">{row.code}</span> }, { header: 'Descripción', accessor: (row: Aula) => row.description || '—' }, { header: 'Estado puerta', accessor: (row: Aula) => (<Badge variant={row.actual_state === 'OPEN' ? 'default' : 'secondary'}>{row.actual_state === 'OPEN' ? 'Abierta' : 'Cerrada'}</Badge>) }, { header: 'Acciones', accessor: (row: Aula) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEditAula(row)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setAulaToDelete(row)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></div>) }];
  const permisoColumns = [{ header: 'Usuario', accessor: (row: AccessPermission) => (<div><p className="font-medium text-slate-900">{row.user_nombre || '—'}</p><p className="text-xs text-slate-500">{row.user_email || '...'}</p></div>) }, { header: 'Aula', accessor: (row: AccessPermission) => (<div><span className="font-mono font-semibold">{row.aula_code || '—'}</span></div>) }, { header: 'Horario', accessor: (row: AccessPermission) => (<span className="text-sm">{row.schedule_display || '—'}</span>) }, { header: 'Estado', accessor: (row: AccessPermission) => (<Badge variant={row.is_active ? 'default' : 'secondary'}>{row.is_active ? 'Activo' : 'Inactivo'}</Badge>) }, { header: 'Acciones', accessor: (row: AccessPermission) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEditPermiso(row)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setPermisoToDelete(row)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></div>) }];
  const eventColumns = [{ header: 'Fecha/Hora', accessor: (row: AccessEvent) => <span className="text-xs font-mono">{format(new Date(row.timestamp), 'dd/MM HH:mm:ss', { locale: es })}</span> }, { header: 'Usuario', accessor: (row: AccessEvent) => row.user_nombre || 'Desconocido' }, { header: 'Aula', accessor: (row: AccessEvent) => row.aula_code || '—' }, { header: 'Resultado', accessor: (row: AccessEvent) => <Badge variant={row.result === 'SUCCESS' ? 'default' : 'destructive'}>{row.result === 'SUCCESS' ? 'Permitido' : 'Denegado'}</Badge> }];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Shield className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Operativo</h1><p className="text-slate-500 text-sm">Administración y monitoreo de la terminal</p></div></div><div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl font-mono text-sm font-bold text-amber-700"><Phone className="h-4 w-4" /> {SOPORTE_TELEFONO}</div></div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-auto gap-1">
              <TabsTrigger value="dashboard" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Activity className="h-4 w-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="usuarios" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Users className="h-4 w-4" /> Usuarios</TabsTrigger>
              <TabsTrigger value="calendario" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><CalendarIcon className="h-4 w-4" /> Calendario</TabsTrigger>
              <TabsTrigger value="horarios" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Clock className="h-4 w-4" /> Horarios</TabsTrigger>
              <TabsTrigger value="aulas" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><DoorOpen className="h-4 w-4" /> Aulas</TabsTrigger>
              <TabsTrigger value="permisos" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Key className="h-4 w-4" /> Permisos</TabsTrigger>
              <TabsTrigger value="monitoreo" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Activity className="h-4 w-4" /> Monitoreo</TabsTrigger>
              <TabsTrigger value="reportes" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><FileText className="h-4 w-4" /> Reportes</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-6 pt-2">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5"><KPICard title="Accesos Hoy" value={kpiData?.total_accesos_hoy || 0} icon={Activity} /><KPICard title="Tasa Éxito" value={`${kpiData?.tasa_exito || 0}%`} icon={CheckCircle} className="text-emerald-600" /><KPICard title="Tasa Rechazo" value={`${kpiData?.tasa_rechazo || 0}%`} icon={XCircle} className="text-red-600" /><KPICard title="Alertas" value={kpiData?.alertas_activas || 0} icon={AlertTriangle} className={kpiData?.alertas_activas ? 'animate-pulse text-amber-500' : ''} /><KPICard title="Usuarios" value={kpiData?.usuarios_activos || 0} icon={Users} /></div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card><CardHeader><CardTitle className="text-lg">Flujo Horario</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={kpiData?.accesos_por_hora || []}><XAxis dataKey="hora" /><YAxis /><Tooltip /><Bar dataKey="cantidad" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-lg">Top Aulas</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={kpiData?.top_aulas || []} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="aula" type="category" /><Tooltip /><Bar dataKey="cantidad" fill="#0f172a" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="usuarios" className="pt-2">
              <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Padrón de Usuarios</CardTitle><CardDescription>Gestión de identidad y roles operativos</CardDescription></div><Button onClick={() => { setEditingUser(null); setIsUserDialogOpen(true); }} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nuevo Usuario</Button></CardHeader><CardContent><DataTable data={usuarios} columns={userColumns} isLoading={usuariosLoading} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="calendario" className="space-y-6 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between"><div><CardTitle className="text-lg">Calendario Semanal</CardTitle><CardDescription>Visualización y asignación rápida de espacios</CardDescription></div><Button variant="outline" size="sm" onClick={() => refetchPermisos()}><RefreshCw className="h-4 w-4 mr-2" /> Sincronizar</Button></div>
              <Card className="border-none shadow-xl overflow-hidden bg-slate-50/20"><div className="grid grid-cols-[70px_repeat(7,1fr)] bg-slate-100 border-b"><div className="p-3"></div>{DIAS_SEMANA.map((dia, i) => (<div key={dia} className="p-3 text-[10px] font-black uppercase text-center text-slate-500 border-l">{dia}</div>))}</div>
                <div className="relative h-[600px] overflow-y-auto">{HORAS.map(hora => (<div key={hora} className="grid grid-cols-[70px_repeat(7,1fr)] h-12 border-b border-slate-100"><div className="text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center bg-slate-50">{hora}:00</div>{[0, 1, 2, 3, 4, 5, 6].map(dia => {
                    const permsInSlot = permisosData?.results?.filter(p => p.schedule_day === dia && parseInt(p.schedule_start?.split(':')[0] || '0') === hora);
                    return (<div key={dia} className="border-l border-slate-100 relative hover:bg-indigo-50/30 cursor-pointer transition-colors" onClick={() => { setSelectedSlot({ day: dia, hour: hora }); setIsClassDialogOpen(true); }}>{permsInSlot?.map(p => (<div key={p.id} className="absolute inset-1 bg-indigo-600 text-white p-1 rounded-lg text-[8px] font-bold overflow-hidden shadow-sm"><p className="truncate uppercase leading-tight">{p.user_nombre}</p><p className="opacity-80 truncate">{p.aula_code}</p></div>))}</div>);
                  })}</div>))}</div>
              </Card>
            </TabsContent>
            <TabsContent value="horarios" className="pt-2"><Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Maestro de Horarios</CardTitle><CardDescription>Bloques temporales del sistema</CardDescription></div><Button onClick={openCreateSchedule} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nuevo Horario</Button></CardHeader><CardContent><DataTable data={horariosData?.results || []} columns={scheduleColumns} isLoading={horariosLoading} /></CardContent></Card></TabsContent>
            <TabsContent value="aulas" className="pt-2"><Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Gestión de Aulas</CardTitle><CardDescription>Espacios y puertas controladas</CardDescription></div><Button onClick={openCreateAula} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nueva Aula</Button></CardHeader><CardContent><DataTable data={aulasData?.results || []} columns={aulaColumns} isLoading={aulasLoading} /></CardContent></Card></TabsContent>
            <TabsContent value="permisos" className="pt-2"><Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Permisos de Acceso</CardTitle><CardDescription>Vinculación de Usuarios, Aulas y Horarios</CardDescription></div><Button onClick={openCreatePermiso} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nuevo Permiso</Button></CardHeader><CardContent><DataTable data={permisosData?.results || []} columns={permisoColumns} isLoading={permisosLoading} /></CardContent></Card></TabsContent>
            <TabsContent value="monitoreo" className="pt-2"><Card className="border-none shadow-sm pb-0"><CardHeader className="bg-slate-50 border-b"><div><CardTitle className="text-lg">Eventos en Vivo</CardTitle><CardDescription>Historial en tiempo real</CardDescription></div></CardHeader><DataTable data={eventos} columns={eventColumns} isLoading={eventosLoading} /></Card></TabsContent>
            <TabsContent value="reportes" className="space-y-6 pt-2">
              <div className="flex bg-white p-6 rounded-2xl border border-slate-100 gap-4 items-end"><div className="flex-1 space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Rango de Auditoría</Label><div className="flex gap-2 items-center"><Input type="date" value={reportDates.start_date} onChange={e => setReportDates(d => ({ ...d, start_date: e.target.value }))} /><Input type="date" value={reportDates.end_date} onChange={e => setReportDates(d => ({ ...d, end_date: e.target.value }))} /></div></div><Button variant="secondary" onClick={() => exportarEventos.mutate(reportDates)}><Download className="h-4 w-4 mr-2" /> Exportar CSV</Button></div>
              <div className="grid gap-4 sm:grid-cols-4"><KPICard title="Accesos" value={reporteData?.total_accesos || 0} icon={FileText} /><KPICard title="Permitidos" value={reporteData?.accesos_permitidos || 0} icon={CheckCircle} className="text-emerald-600" /><KPICard title="Denegados" value={reporteData?.accesos_denegados || 0} icon={XCircle} className="text-red-500" /><KPICard title="Puntualidad" value={`${reporteData?.tasa_puntualidad || 0}%`} icon={Clock} /></div>
            </TabsContent>
          </Tabs>
        </div>

        {/* DIALOGS */}
        <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}><DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl"><div className="bg-indigo-600 p-6 text-white text-left"><DialogTitle className="uppercase font-black italic tracking-tighter text-xl">Asignar Espacio</DialogTitle></div><div className="p-6 space-y-4 text-left"><div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Docente</Label><Select onValueChange={v => setNewPermiso(p => ({ ...p, user: v }))}><SelectTrigger className="bg-slate-50 border-slate-200 h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Aula</Label><Select onValueChange={v => setNewPermiso(p => ({ ...p, aula: v }))}><SelectTrigger className="bg-slate-50 border-slate-200 h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{aulasData?.results?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Duración (Horas)</Label><Select onValueChange={v => setNewPermiso(p => ({ ...p, duration: parseInt(v) }))}><SelectTrigger className="bg-slate-50 border-slate-200 h-11"><SelectValue placeholder="1 hora" /></SelectTrigger><SelectContent><SelectItem value="1">1 hora</SelectItem><SelectItem value="2">2 horas</SelectItem><SelectItem value="3">3 horas</SelectItem></SelectContent></Select></div><DialogFooter className="pt-4"><Button className="w-full bg-indigo-600 h-12 font-bold uppercase text-xs tracking-widest text-white shadow-lg shadow-indigo-200" onClick={handleCreateAppointment}>Confirmar Registro</Button></DialogFooter></div></DialogContent></Dialog>
        
        {/* Biometría Dialog (Identical to Admin) */}
        <Dialog open={isBioDialogOpen} onOpenChange={setIsBioDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Enrolar Biometría</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-4">
                <label htmlFor="bio-up" className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl p-8 hover:bg-indigo-50 hover:border-indigo-400 transition-all group">
                  <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-3 group-hover:scale-110 transition-transform"><Upload className="h-6 w-6" /></div>
                  <span className="text-sm font-bold text-indigo-700">Presiona para elegir archivos</span>
                  <input id="bio-up" type="file" multiple className="hidden" onChange={e => handleFileChange(e.target.files)} />
                </label>
                {bioPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {bioPreviews.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100 group/thumb">
                        <img src={url} className="w-full h-full object-cover" />
                        <button onClick={() => removeBioFile(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/thumb:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsBioDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleBioSubmit} className="bg-indigo-600 text-white" disabled={enrolarBiometria.isPending}>{enrolarBiometria.isPending ? 'Procesando...' : 'Guardar Biometría'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* User form (Design and Logic identical to Admin) */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveUser} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Nombre</Label><Input name="nombre" defaultValue={editingUser?.nombre ?? ''} required /></div>
                <div className="space-y-1"><Label>Apellido</Label><Input name="apellido" defaultValue={editingUser?.apellido ?? ''} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Usuario (login)</Label><Input name="username" defaultValue={editingUser?.username ?? ''} required={!editingUser} /></div>
                <div className="space-y-1">
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <Input name="password" type={showPassword ? 'text' : 'password'} placeholder={editingUser ? '••••••••' : 'Contraseña'} required={!editingUser} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
              <div className="space-y-1"><Label>Email</Label><Input name="email" defaultValue={editingUser?.email ?? ''} required type="email" /></div>
              <div className="space-y-1">
                <Label>DUI (00000000-0)</Label>
                <Input 
                  name="dui" 
                  value={formDui}
                  placeholder="00000000-0" 
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 9) val = val.slice(0, 9);
                    if (val.length > 8) {
                      setFormDui(val.slice(0, 8) + '-' + val.slice(8));
                    } else {
                      setFormDui(val);
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Residencia</Label><Input name="residencia" defaultValue={editingUser?.residencia ?? ''} /></div>
                <div className="space-y-1">
                  <Label>PIN (Biométrico)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1"><Input value={formPin} onChange={e => setFormPin(e.target.value.replace(/\D/g, ''))} maxLength={10} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-4 w-4" /></button></div>
                    <Button type="button" variant="outline" size="icon" onClick={handleGeneratePin}><RefreshCw className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyPin} disabled={!formPin}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="usr_active" name="is_active" value="true" defaultChecked={editingUser ? editingUser.is_active : true} className="h-4 w-4" />
                <Label htmlFor="usr_active">Usuario activo</Label>
              </div>

              {/* Role Restricted (Only Docente and Biometrico) */}
              <div className="space-y-2 border-t pt-3">
                <Label className="flex items-center gap-1.5 text-sm font-semibold"><Shield className="h-4 w-4" /> Asignar rol</Label>
                <div className="flex flex-wrap gap-2">
                  {['DOCENTE', 'BIOMETRICO'].map(r => (
                    <button key={r} type="button" onClick={() => togglePendingRole(r)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${pendingRoleToAdd === r ? ROLE_COLORS[r] + ' border-current shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}>
                      {pendingRoleToAdd === r && <span className="mr-1">✓</span>} {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createUsuario.isPending || updateUsuario.isPending}>{editingUser ? 'Actualizar' : 'Guardar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!userToDelete} onOpenChange={o => !o && setUserToDelete(null)}><DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirmar eliminación</DialogTitle></DialogHeader>
          <div className="py-4 text-left"><p className="text-sm text-slate-600">¿Estás seguro de eliminar a <strong>{userToDelete?.nombre} {userToDelete?.apellido}</strong>?</p><p className="text-xs text-red-500 mt-2">Esta acción no se puede deshacer.</p></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setUserToDelete(null)}>Cancelar</Button><Button variant="destructive" onClick={confirmDeleteUser}>Eliminar</Button></div>
        </DialogContent></Dialog>

        {/* Other CRUD Dialogs (already identical) */}
        <Dialog open={isScheduleCRUDDialogOpen} onOpenChange={setIsScheduleCRUDDialogOpen}><DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl"><div className="bg-indigo-600 p-6 text-white text-left"><DialogTitle className="text-xl font-black italic uppercase tracking-tighter">{editingSchedule ? 'Editar Horario' : 'Nuevo Horario Master'}</DialogTitle></div><form onSubmit={handleSaveSchedule} className="p-6 space-y-6 bg-white text-left"><div className="flex items-center space-x-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100 italic"><input type="checkbox" id="sc-any" className="h-5 w-5 rounded border-indigo-300 text-indigo-600" checked={scheduleFormData.is_anytime} onChange={e => setScheduleFormData({...scheduleFormData, is_anytime: e.target.checked})} /><Label htmlFor="sc-any" className="text-indigo-900 font-black text-sm uppercase cursor-pointer">Acceso Total (Especial)</Label></div>{!scheduleFormData.is_anytime && (<div className="space-y-4"><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Día Semanal</Label><Select value={scheduleFormData.day_of_week} onValueChange={v => setScheduleFormData({...scheduleFormData, day_of_week: v })}><SelectTrigger className="h-11 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent>{DIAS_SEMANA.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><div className="flex justify-between items-center"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Hora Inicio</Label>{scheduleFormData.start_time && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{formatTimeAMPM(scheduleFormData.start_time)}</span>}</div><Input type="time" value={scheduleFormData.start_time} onChange={e => setScheduleFormData({...scheduleFormData, start_time: e.target.value})} required className="h-11 bg-slate-50" /></div><div className="space-y-1"><div className="flex justify-between items-center"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Hora Fin</Label>{scheduleFormData.end_time && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{formatTimeAMPM(scheduleFormData.end_time)}</span>}</div><Input type="time" value={scheduleFormData.end_time} onChange={e => setScheduleFormData({...scheduleFormData, end_time: e.target.value})} required className="h-11 bg-slate-50" /></div></div></div>)}<DialogFooter className="pt-4 border-t"><Button type="submit" className="w-full bg-indigo-600 h-12 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100">Confirmar Cambios</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={!!scheduleToDelete} onOpenChange={o => !o && setScheduleToDelete(null)}><DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-6 text-left"><DialogHeader><DialogTitle className="text-red-600 uppercase font-black italic tracking-tighter">Eliminar Horario</DialogTitle></DialogHeader><div className="py-4 space-y-4"><p className="text-sm font-medium text-slate-600">¿Estás seguro de eliminar este bloque?</p><div className="p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-xs font-black text-red-900 uppercase">{scheduleToDelete?.is_anytime ? 'Acceso Total' : `${DIAS_SEMANA[scheduleToDelete?.day_of_week || 0]} ${formatTimeAMPM(scheduleToDelete?.start_time || '')}`}</p></div></div><div className="flex gap-2 items-center"><Button variant="ghost" className="flex-1 h-12 text-slate-400 font-bold" onClick={() => setScheduleToDelete(null)}>Cancelar</Button><Button variant="destructive" className="flex-1 h-12 bg-red-600 shadow-lg shadow-red-100 font-black uppercase text-xs tracking-widest" onClick={confirmDeleteSchedule}>Confirmar Baja</Button></div></DialogContent></Dialog>
        <Dialog open={isAulaCRUDDialogOpen} onOpenChange={setIsAulaCRUDDialogOpen}><DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl"><div className="bg-indigo-600 p-6 text-white text-left"><DialogTitle className="text-xl font-black italic uppercase tracking-tighter">{editingAula ? 'Editar Aula' : 'Nueva Aula'}</DialogTitle></div><form onSubmit={handleSaveAula} className="p-6 space-y-6 bg-white text-left"><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Código</Label><Input placeholder="Ej: A-101" value={aulaFormData.code} onChange={e => setAulaFormData({ ...aulaFormData, code: e.target.value })} required className="h-11 bg-slate-50" /></div><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Descripción</Label><Input placeholder="Ej: Laboratorio" value={aulaFormData.description} onChange={e => setAulaFormData({ ...aulaFormData, description: e.target.value })} required className="h-11 bg-slate-50" /></div><div className="flex items-center space-x-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100"><input type="checkbox" checked={aulaFormData.is_active} onChange={e => setAulaFormData({...aulaFormData, is_active: e.target.checked})} className="h-5 w-5" /><Label className="text-indigo-900 font-black text-sm uppercase">Activa</Label></div><DialogFooter className="pt-4 border-t"><Button type="submit" className="w-full bg-indigo-600 h-12 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={!!aulaToDelete} onOpenChange={o => !o && setAulaToDelete(null)}><DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-6 text-left"><DialogHeader><DialogTitle className="text-red-600 uppercase font-black italic tracking-tighter">Eliminar Aula</DialogTitle></DialogHeader><div className="py-4 space-y-4"><p className="text-sm font-medium text-slate-600">¿Eliminar aula <strong>{aulaToDelete?.code}</strong>?</p></div><div className="flex gap-2 items-center"><Button variant="ghost" className="flex-1 h-12 text-slate-400 font-bold" onClick={() => setAulaToDelete(null)}>Cancelar</Button><Button variant="destructive" className="flex-1 h-12 bg-red-600 shadow-lg shadow-red-100 font-black uppercase text-xs tracking-widest" onClick={confirmDeleteAula}>Eliminar</Button></div></DialogContent></Dialog>
        <Dialog open={isPermisoCRUDDialogOpen} onOpenChange={setIsPermisoCRUDDialogOpen}><DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl"><div className="bg-indigo-600 p-6 text-white text-left"><DialogTitle className="text-xl font-black italic uppercase tracking-tighter">{editingPermiso ? 'Editar Permiso' : 'Nuevo Permiso'}</DialogTitle></div><form onSubmit={handleSavePermiso} className="p-6 space-y-6 bg-white text-left"><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Usuario</Label><Select value={permisoFormData.user} onValueChange={v => setPermisoFormData({ ...permisoFormData, user: v })}><SelectTrigger className="h-11 bg-slate-50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{usuarios.map(u => (<SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>))}</SelectContent></Select></div><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Aula</Label><Select value={permisoFormData.aula} onValueChange={v => setPermisoFormData({ ...permisoFormData, aula: v })}><SelectTrigger className="h-11 bg-slate-50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{aulasData?.results?.filter(a => a.is_active).map(a => (<SelectItem key={a.id} value={a.id}>{a.code}</SelectItem>))}</SelectContent></Select></div><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Horario</Label><Select value={permisoFormData.schedule} onValueChange={v => setPermisoFormData({ ...permisoFormData, schedule: v })}><SelectTrigger className="h-11 bg-slate-50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{horariosData?.results?.map(h => (<SelectItem key={h.id} value={h.id}>{h.is_anytime ? 'Acceso Total' : `${DIAS_SEMANA[h.day_of_week ?? 0]} ${formatTimeAMPM(h.start_time || '')}`}</SelectItem>))}</SelectContent></Select></div><div className="flex items-center space-x-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100 italic"><input type="checkbox" checked={permisoFormData.is_active} onChange={e => setPermisoFormData({...permisoFormData, is_active: e.target.checked})} className="h-5 w-5" /><Label className="text-indigo-900 font-black text-sm uppercase">Habilitado</Label></div><DialogFooter className="pt-4 border-t"><Button type="submit" className="w-full bg-indigo-600 h-12 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={!!permisoToDelete} onOpenChange={o => !o && setPermisoToDelete(null)}><DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-6 text-left"><DialogHeader><DialogTitle className="text-red-600 uppercase font-black italic tracking-tighter">Revocar</DialogTitle></DialogHeader><div className="py-4 space-y-4"><p className="text-sm font-medium text-slate-600">¿Revocar acceso para <strong>{permisoToDelete?.user_nombre}</strong>?</p></div><div className="flex gap-2 items-center"><Button variant="ghost" className="flex-1 h-12 text-slate-400 font-bold" onClick={() => setPermisoToDelete(null)}>Cancelar</Button><Button variant="destructive" className="flex-1 h-12 bg-red-600 shadow-lg shadow-red-100 font-black uppercase text-xs tracking-widest" onClick={confirmDeletePermiso}>Revocar</Button></div></DialogContent></Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
