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
  usePermissions,
  useCreatePermiso,
  useUpdatePermiso,
  useDeletePermiso,
  useCreateHorario,
  useUpdateHorario,
  useDeleteHorario,
  useUpsertCalendarEvent,
  useExportarEventos,
  useExportarExcel
} from '@/lib/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, CheckCircle, XCircle, AlertTriangle, Users, 
  Phone, Upload, FileText, Download, Clock, Shield, Search, X, Calendar as CalendarIcon, Plus, Filter, RefreshCw, DoorOpen,
  Eye, EyeOff, Copy, Pencil, Trash2, Key, Fingerprint
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, addDays, startOfDay, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, AccessEvent, Aula, Schedule, AccessPermission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { KPICard } from '@/components/kpi-card';
import { DataTable } from '@/components/data-table';
import { WebcamCapture } from '@/components/webcam-capture';
import { CalendarEventModal } from '@/components/calendar-event-modal';
import { WeeklyCalendar } from '@/components/weekly-calendar';
import { useAuth } from '@/lib/auth-context';
import { cn, formatTimeAMPM } from '@/lib/utils';

const SOPORTE_TELEFONO = '+503 7111-2300';
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
  const [dashboardMode, setDashboardMode] = useState<'classic' | 'interactive'>('classic');
  const [dashboardColor, setDashboardColor] = useState('#3b82f6');
  const [dateRange, setDateRange] = useState<{ start_date: string; end_date: string } | undefined>(undefined);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');

  const kpiFilters = dateRange;
  const { data: kpiData, isLoading: kpiLoading } = useKPIData(kpiFilters);

  const handlePeriodChange = (p: 'today' | 'week' | 'month' | 'year') => {
    setPeriod(p);
    const end = new Date();
    let start = new Date();
    
    if (p === 'today') {
      setDateRange(undefined); // No date range for today, API defaults to today
      return;
    } else if (p === 'week') {
      start = addDays(end, -7);
    } else if (p === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (p === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    }
    
    setDateRange({
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd')
    });
  };

  useEffect(() => {
    const savedColor = localStorage.getItem('dashboard_color');
    if (savedColor) setDashboardColor(savedColor);
  }, []);

  const [showPermanent, setShowPermanent] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Dashboard Data ---
  // const { data: kpiData, isLoading: kpiLoading } = useKPIData(); // This line is now replaced by the one above
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
  const exportarExcel = useExportarExcel();

  // --- Schedules & Permissions ---
  const { data: aulasData, isLoading: aulasLoading } = useAulas();
  const createAula = useCreateAula();
  const updateAula = useUpdateAula();
  const deleteAula = useDeleteAula();
  const { data: permisosData, isLoading: permisosLoading, refetch: refetchPermisos } = usePermissions();
  const updatePermiso = useUpdatePermiso();
  const deletePermiso = useDeletePermiso();
  const { data: horariosData, isLoading: horariosLoading } = useHorarios();
  const createHorario = useCreateHorario();
  const updateHorario = useUpdateHorario();
  const deleteHorario = useDeleteHorario();
  const upsertEvent = useUpsertCalendarEvent();
  const createPermiso = useCreatePermiso();
  const queryClient = useQueryClient();
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any>(null);

  // --- Aula CRUD States ---
  const [isAulaCRUDDialogOpen, setIsAulaCRUDDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [aulaFormData, setAulaFormData] = useState({ code: '', description: '', is_active: true });
  const [aulaToDelete, setAulaToDelete] = useState<Aula | null>(null);

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

  const handleOpenEventModal = (data: any = null) => {
    setModalInitialData(data);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (data: any) => {
    try {
      await upsertEvent.mutateAsync(data);
      toast({ title: 'Horario/Permiso guardado exitosamente' });
      setIsEventModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      await deletePermiso.mutateAsync(id);
      toast({ title: 'Permiso eliminado' });
      setIsEventModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    }
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

  // --- Columns ---
  const userColumns = [
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
        <Badge variant={row.is_active ? 'default' : 'secondary'} className="shadow-none">
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: User) => {
        const isAdminOrSub = row.roles?.some(r => r === 'ADMIN' || r === 'SUBADMIN');
        const canEdit = hasRole('ADMIN') || !isAdminOrSub;
        return (
          <div className="flex gap-1">
            <button className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors disabled:opacity-30" onClick={() => { setEditingUser(row); setFormDui(row.dui || ''); setFormPin(''); setIsUserDialogOpen(true); }} disabled={!canEdit}><Pencil className="h-4 w-4" /></button>
            <button className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-slate-50 transition-colors" onClick={() => { setSelectedForBio(row); setIsBioDialogOpen(true); }}><Fingerprint className="h-4 w-4" /></button>
            <button className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-50 transition-colors disabled:opacity-30" onClick={() => setUserToDelete(row)} disabled={!canEdit}><Trash2 className="h-4 w-4" /></button>
          </div>
        );
      },
    },
  ];

  const scheduleColumns = [{ header: 'Día', accessor: (row: Schedule) => (<span className="font-bold text-slate-700">{row.is_anytime ? <span className="text-indigo-600">Acceso Total</span> : DIAS_SEMANA[row.day_of_week || 0]}</span>) }, { header: 'Hora', accessor: (row: Schedule) => (<span className="font-mono text-xs">{row.is_anytime ? '--:--' : `${formatTimeAMPM(row.start_time || '')} — ${formatTimeAMPM(row.end_time || '')}`}</span>) }, { header: 'Acciones', accessor: (row: Schedule) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => handleOpenEventModal(row)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></Button></div>) }];
  const aulaColumns = [{ header: 'Código', accessor: (row: Aula) => <span className="font-mono font-semibold">{row.code}</span> }, { header: 'Descripción', accessor: (row: Aula) => row.description || '—' }, { header: 'Estado puerta', accessor: (row: Aula) => (<Badge variant={row.actual_state === 'OPEN' ? 'default' : 'secondary'}>{row.actual_state === 'OPEN' ? 'Abierta' : 'Cerrada'}</Badge>) }, { header: 'Acciones', accessor: (row: Aula) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEditAula(row)} className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setAulaToDelete(row)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></div>) }];
  const permisoColumns = [
    { 
      header: 'Usuario', 
      accessor: (row: AccessPermission) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] border border-slate-200 shrink-0">
            {row.user_nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <Users className="h-3 w-3" />}
          </div>
          <div className="overflow-hidden text-left">
            <p className="font-bold text-slate-900 truncate text-xs">{row.user_nombre || '—'}</p>
            <p className="text-[10px] text-slate-500 truncate">{row.user_email || '...'}</p>
          </div>
        </div>
      ) 
    },
    { header: 'Aula', accessor: (row: AccessPermission) => (<div className="text-left"><span className="font-mono font-bold text-indigo-600 text-xs px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100">{row.aula_code || '—'}</span></div>) },
    { header: 'Horario', accessor: (row: AccessPermission) => (<div className="text-left font-medium text-slate-700 text-xs">{row.schedule_display || '—'}</div>) },
    { header: 'Estado', accessor: (row: AccessPermission) => (<Badge variant={row.is_active ? 'default' : 'secondary'} className="shadow-none text-[10px]">{row.is_active ? 'Activo' : 'Inactivo'}</Badge>) },
    { header: 'Acciones', accessor: (row: AccessPermission) => (<div className="flex gap-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => { setModalInitialData(row); setIsEventModalOpen(true); }}><Pencil className="h-4 w-4" /></Button></div>) }
  ];
  const eventColumns = [{ header: 'Fecha/Hora', accessor: (row: AccessEvent) => <span className="text-xs font-mono">{format(new Date(row.timestamp), 'dd/MM HH:mm:ss', { locale: es })}</span> }, { header: 'Usuario', accessor: (row: AccessEvent) => row.user_nombre || 'Desconocido' }, { header: 'Aula', accessor: (row: AccessEvent) => row.aula_code || '—' }, { header: 'Resultado', accessor: (row: AccessEvent) => <Badge variant={row.result === 'SUCCESS' ? 'default' : 'destructive'}>{row.result === 'SUCCESS' ? 'Permitido' : 'Denegado'}</Badge> }];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Shield className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Operativo</h1><p className="text-slate-500 text-sm">Administración y monitoreo de la terminal</p></div></div><div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl font-mono text-sm font-bold text-amber-700"><Phone className="h-4 w-4" /> {SOPORTE_TELEFONO}</div></div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              <TabsList className="bg-slate-100 p-1 rounded-xl h-auto gap-1 w-max min-w-full">
                <TabsTrigger value="dashboard" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Activity className="h-4 w-4" /> Dashboard</TabsTrigger>
                <TabsTrigger value="usuarios" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Users className="h-4 w-4" /> Usuarios</TabsTrigger>
                <TabsTrigger value="horarios" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Clock className="h-4 w-4" /> Horarios</TabsTrigger>
                <TabsTrigger value="aulas" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><DoorOpen className="h-4 w-4" /> Aulas</TabsTrigger>
                <TabsTrigger value="permisos" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Key className="h-4 w-4" /> Permisos</TabsTrigger>
                <TabsTrigger value="monitoreo" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><Activity className="h-4 w-4" /> Monitoreo</TabsTrigger>
                <TabsTrigger value="reportes" className="px-4 sm:px-6 py-2.5 rounded-lg data-[state=active]:bg-white transition-all gap-2"><FileText className="h-4 w-4" /> Reportes</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="dashboard" className="space-y-6 pt-2">
              <div className="grid gap-1 sm:gap-4 grid-cols-4 lg:grid-cols-5"><KPICard title="Accesos Hoy" value={kpiData?.total_accesos || 0} icon={Activity} /><KPICard title="Tasa Éxito" value={`${kpiData?.tasa_exito || 0}%`} icon={CheckCircle} className="text-emerald-600" /><KPICard title="Tasa Rechazo" value={`${kpiData?.tasa_rechazo || 0}%`} icon={XCircle} className="text-red-600" /><KPICard title="Alertas" value={kpiData?.alertas_activas || 0} icon={AlertTriangle} className={kpiData?.alertas_activas ? 'animate-pulse text-amber-500' : ''} /><KPICard title="Usuarios" value={kpiData?.usuarios_activos || 0} icon={Users} /></div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card><CardHeader><CardTitle className="text-lg">Flujo Horario</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={kpiData?.accesos_por_hora || kpiData?.accesos_por_dia || []}><XAxis dataKey="hora" /><YAxis /><Tooltip /><Bar dataKey="cantidad" fill="#0f172a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-lg">Accesos por Método</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={kpiData?.accesos_por_metodo || []}><XAxis dataKey="metodo" /><YAxis /><Tooltip /><Bar dataKey="cantidad" fill="#0f172a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-lg">Top Aulas (Accesos)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={kpiData?.top_aulas || []} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="aula" type="category" /><Tooltip /><Bar dataKey="cantidad" fill="#0f172a" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="usuarios" className="pt-2">
              <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Padrón de Usuarios</CardTitle><CardDescription>Gestión de identidad y roles operativos</CardDescription></div><Button onClick={() => { setEditingUser(null); setIsUserDialogOpen(true); }} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nuevo Usuario</Button></CardHeader><CardContent><DataTable data={usuarios} columns={userColumns} isLoading={usuariosLoading} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="horarios" className="space-y-6 pt-2 h-[calc(100vh-250px)]">
              <div className="flex flex-wrap items-center justify-end mb-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden lg:flex"
                >
                  {isSidebarOpen ? 'Ocultar Panel' : 'Mostrar Panel'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => refetchPermisos()} className="bg-white">
                  <RefreshCw className="h-4 w-4 mr-2" /> Sincronizar
                </Button>
                <Button onClick={() => handleOpenEventModal()} className="bg-indigo-600">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Horario
                </Button>
              </div>

              <div className={cn(
                "grid grid-cols-1 gap-6 h-full transition-all duration-300",
                isSidebarOpen ? "lg:grid-cols-4" : "lg:grid-cols-1"
              )}>
                <div className={cn("h-full", isSidebarOpen ? "lg:col-span-3" : "lg:col-span-1")}>
                  <Card className="border-none shadow-xl overflow-hidden h-full bg-white">
                    <WeeklyCalendar permissions={permisosData?.results || []} />
                  </Card>
                </div>
                {isSidebarOpen && (
                  <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm mb-3">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        Acceso Permanente
                      </h3>
                      <div className="space-y-2">
                        {permisosData?.results.filter(p => p.schedule_is_anytime).length === 0 ? (
                          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sin Accesos Permanentes</p>
                          </div>
                        ) : (
                          permisosData?.results
                            .filter(p => p.schedule_is_anytime)
                            .map(p => (
                              <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition-colors text-left">
                                <div className="flex justify-between items-start">
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-slate-900 truncate">{p.user_nombre}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{p.aula_code}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeletePermission(p.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="aulas" className="pt-2"><Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Gestión de Aulas</CardTitle><CardDescription>Espacios y puertas controladas</CardDescription></div><Button onClick={openCreateAula} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nueva Aula</Button></CardHeader><CardContent><DataTable data={aulasData?.results || []} columns={aulaColumns} isLoading={aulasLoading} /></CardContent></Card></TabsContent>
            <TabsContent value="permisos" className="pt-2"><Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Permisos de Acceso</CardTitle><CardDescription>Vinculación de Usuarios, Aulas y Horarios</CardDescription></div><Button onClick={() => handleOpenEventModal()} className="bg-indigo-600"><Plus className="h-4 w-4 mr-2" /> Nuevo Permiso</Button></CardHeader><CardContent><DataTable data={permisosData?.results || []} columns={permisoColumns} isLoading={permisosLoading} /></CardContent></Card></TabsContent>
            <TabsContent value="monitoreo" className="pt-2"><Card className="border-none shadow-sm pb-0"><CardHeader className="bg-slate-50 border-b"><div><CardTitle className="text-lg">Eventos en Vivo</CardTitle><CardDescription>Historial en tiempo real</CardDescription></div></CardHeader><CardContent className="p-0"><DataTable data={eventos} columns={eventColumns} isLoading={eventosLoading} /></CardContent></Card></TabsContent>
            <TabsContent value="reportes" className="space-y-6 pt-2">
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Exportar Reportes</CardTitle>
                      <CardDescription>Descarga el historial de accesos en formato Excel o CSV</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 space-y-2 w-full">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Rango de fechas</Label>
                      <div className="flex gap-2 items-center">
                        <Input type="date" className="h-11 shadow-sm" value={reportDates.start_date} onChange={e => setReportDates(d => ({ ...d, start_date: e.target.value }))} />
                        <div className="h-px w-4 bg-slate-300 shrink-0" />
                        <Input type="date" className="h-11 shadow-sm" value={reportDates.end_date} onChange={e => setReportDates(d => ({ ...d, end_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        className="flex-1 md:flex-none h-11 border-slate-200 hover:bg-slate-50 font-bold"
                        onClick={() => exportarEventos.mutate(reportDates)}
                        disabled={exportarEventos.isPending}
                      >
                        {exportarEventos.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2 text-slate-500" />}
                        Descargar CSV
                      </Button>
                      <Button 
                        className="flex-1 md:flex-none h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold"
                        onClick={() => exportarExcel.mutate(reportDates)}
                        disabled={exportarExcel.isPending}
                      >
                        {exportarExcel.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Exportar Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-1 sm:gap-4 grid-cols-4">
                <KPICard title="Total Registros" value={reporteData?.total_accesos || 0} icon={FileText} />
                <KPICard title="Accesos Exitosos" value={reporteData?.accesos_permitidos || 0} icon={CheckCircle} className="text-emerald-600" />
                <KPICard title="Accesos Denegados" value={reporteData?.accesos_denegados || 0} icon={XCircle} className="text-red-500" />
                <KPICard title="Tasa Puntualidad" value={`${reporteData?.tasa_puntualidad || 0}%`} icon={Clock} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <CalendarEventModal 
          isOpen={isEventModalOpen} 
          onClose={() => setIsEventModalOpen(false)} 
          onSave={handleSaveEvent} 
          onDelete={handleDeletePermission}
          initialData={modalInitialData}
          allowedRoles={['DOCENTE']}
        />

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>DUI (00000000-0)</Label>
                  <Input 
                    name="dui" 
                    value={formDui}
                    placeholder="00000000-0" 
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 9) val = val.slice(0, 9);
                      if (val.length > 8) { setFormDui(val.slice(0, 8) + '-' + val.slice(8)); } 
                      else { setFormDui(val); }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>PIN (Biométrico)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input value={formPin} onChange={e => setFormPin(e.target.value.replace(/\D/g, ''))} maxLength={10} />
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={handleGeneratePin}><RefreshCw className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyPin} disabled={!formPin}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Residencia</Label><Input name="residencia" defaultValue={editingUser?.residencia ?? ''} /></div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="usr_active" name="is_active" value="true" defaultChecked={editingUser ? editingUser.is_active : true} className="h-4 w-4" />
                  <Label htmlFor="usr_active">Usuario activo</Label>
                </div>
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
 
        <Dialog open={isAulaCRUDDialogOpen} onOpenChange={setIsAulaCRUDDialogOpen}><DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl"><div className="bg-indigo-600 p-6 text-white text-left"><DialogTitle className="text-xl font-black italic uppercase tracking-tighter">{editingAula ? 'Editar Aula' : 'Nueva Aula'}</DialogTitle></div><form onSubmit={handleSaveAula} className="p-6 space-y-6 bg-white text-left"><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Código</Label><Input placeholder="Ej: A-101" value={aulaFormData.code} onChange={e => setAulaFormData({ ...aulaFormData, code: e.target.value })} required className="h-11 bg-slate-50" /></div><div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Descripción</Label><Input placeholder="Ej: Laboratorio" value={aulaFormData.description} onChange={e => setAulaFormData({ ...aulaFormData, description: e.target.value })} required className="h-11 bg-slate-50" /></div><div className="flex items-center space-x-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100"><input type="checkbox" checked={aulaFormData.is_active} onChange={e => setAulaFormData({...aulaFormData, is_active: e.target.checked})} className="h-5 w-5" /><Label className="text-indigo-900 font-black text-sm uppercase">Activa</Label></div><DialogFooter className="pt-4 border-t"><Button type="submit" className="w-full bg-indigo-600 h-12 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100">Guardar</Button></DialogFooter></form></DialogContent></Dialog>
        <Dialog open={!!aulaToDelete} onOpenChange={o => !o && setAulaToDelete(null)}><DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-6 text-left"><DialogHeader><DialogTitle className="text-red-600 uppercase font-black italic tracking-tighter">Eliminar Aula</DialogTitle></DialogHeader><div className="py-4 space-y-4"><p className="text-sm font-medium text-slate-600">¿Eliminar aula <strong>{aulaToDelete?.code}</strong>?</p></div><div className="flex gap-2 items-center"><Button variant="ghost" className="flex-1 h-12 text-slate-400 font-bold" onClick={() => setAulaToDelete(null)}>Cancelar</Button><Button variant="destructive" className="flex-1 h-12 bg-red-600 shadow-lg shadow-red-100 font-black uppercase text-xs tracking-widest" onClick={confirmDeleteAula}>Eliminar</Button></div></DialogContent></Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
