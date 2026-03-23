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
  useEnrolarBiometria, 
  useAlertas, 
  useEventos, 
  useReporte,
  useBiometrics,
  useDeleteBiometric,
  useAulas,
  useHorarios,
  usePermisos,
  useCreatePermiso,
  useDeletePermiso,
  useCreateHorario,
  useExportarEventos
} from '@/lib/api-hooks';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, CheckCircle, XCircle, AlertTriangle, Users, ShieldAlert, UserX, Clock, LayoutDashboard, 
  FileText, Calendar as CalendarIcon, Search, Filter, Download, Plus, Trash2, Edit, ChevronRight, Phone,
  Shield, Upload, RefreshCw, X, DoorOpen
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, addDays, startOfDay, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, AccessEvent, Aula, Schedule, AccessPermission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { KPICard } from '@/components/kpi-card';
import { DataTable } from '@/components/data-table';
import { WebcamCapture } from '@/components/webcam-capture';
import { cn } from '@/lib/utils';

const SOPORTE_TELEFONO = '+503 71112300';
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

const DASHBOARD_COLORS = [
  { value: '#3b82f6', bg: 'bg-blue-500' },
  { value: '#22c55e', bg: 'bg-green-500' },
  { value: '#ef4444', bg: 'bg-red-500' },
  { value: '#f97316', bg: 'bg-orange-500' },
  { value: '#8b5cf6', bg: 'bg-purple-500' },
];

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

  // --- Dashboard Data ---
  // const { data: kpiData, isLoading: kpiLoading } = useKPIData(); // This line is now replaced by the one above
  const { data: alertasData } = useAlertas();
  const alertas = alertasData?.results || [];
  const alertasRecientes = alertas.slice(0, 5);

  // --- Enrollment Data ---
  const { data: usuariosData, isLoading: usuariosLoading } = useUsuarios();
  const usuarios = usuariosData?.results || [];
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bioFiles, setBioFiles] = useState<File[]>([]);
  const [bioPreviews, setBioPreviews] = useState<string[]>([]);
  const enrolarBiometria = useEnrolarBiometria();
  const { data: biometricsData } = useBiometrics(selectedUser?.id);
  const deleteBiometric = useDeleteBiometric();

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

  // --- Schedules & Calendar Data ---
  const { data: aulasData } = useAulas();
  const [aulaFilter, setAulaFilter] = useState('ALL');
  const { data: permisosData, isLoading: permisosLoading, refetch: refetchPermisos } = usePermisos();
  const { data: horariosData } = useHorarios();
  const createHorario = useCreateHorario();
  const createPermiso = useCreatePermiso();
  const deletePermiso = useDeletePermiso();
  
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number, hour: number } | null>(null);
  const [newPermiso, setNewPermiso] = useState({ user: '', aula: '', duration: 1 });

  // Enrollment Helpers
  useEffect(() => {
    if (!isBioDialogOpen) {
      bioPreviews.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
      setBioPreviews([]);
      setBioFiles([]);
    }
  }, [isBioDialogOpen]);

  useEffect(() => {
    if (isBioDialogOpen && biometricsData?.results?.length) {
      const activeBio = biometricsData.results[0];
      if (activeBio.storage_url) setBioPreviews([activeBio.storage_url]);
    }
  }, [isBioDialogOpen, biometricsData]);

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

  const handleBioSubmit = async () => {
    if (!selectedUser) return;
    const hasExistingInPreviews = bioPreviews.some(url => url.startsWith('http'));
    const activeBioRecord = biometricsData?.results?.[0];
    try {
      if (bioFiles.length > 0) {
        await enrolarBiometria.mutateAsync({ usuarioId: selectedUser.id, imagenes: bioFiles });
        toast({ title: 'Biometría enrolada correctamente' });
      } else if (!hasExistingInPreviews && activeBioRecord) {
        await deleteBiometric.mutateAsync(activeBioRecord.id);
        toast({ title: 'Biometría eliminada' });
      }
      setIsBioDialogOpen(false);
    } catch {
      toast({ title: 'Error al procesar biometría', variant: 'destructive' });
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedSlot || !newPermiso.user || !newPermiso.aula) return;
    
    try {
      // 1. Create the Schedule block
      const start_time = `${selectedSlot.hour.toString().padStart(2, '0')}:00:00`;
      const end_time = `${(selectedSlot.hour + newPermiso.duration).toString().padStart(2, '0')}:00:00`;
      
      const sched = await createHorario.mutateAsync({
        day_of_week: selectedSlot.day,
        start_time,
        end_time,
        is_anytime: false
      });

      // 2. Create the Permission linking user, aula, and schedule
      await createPermiso.mutateAsync({
        user: newPermiso.user,
        aula: newPermiso.aula,
        schedule: sched.id,
        is_active: true
      });

      toast({ title: 'Horario asignado exitosamente' });
      setIsClassDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error en asignación', description: err.message, variant: 'destructive' });
    }
  };

  const userColumns = [
    {
      header: 'Usuario',
      accessor: (row: User) => (
        <div>
          <p className="font-medium text-slate-900">{row.nombre} {row.apellido}</p>
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
        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(row); setIsBioDialogOpen(true); }}>
          <Upload className="h-3.5 w-3.5 mr-1.5" /> Enrolar
        </Button>
      ),
    },
  ];

  const METHOD_LABELS: Record<string, string> = { 
    FACE: 'Facial', PIN: 'PIN', MANUAL: 'Manual', OTP: 'OTP' 
  };

  const eventColumns = [
    {
      header: 'Fecha y Hora',
      accessor: (row: AccessEvent) => (
        <span className="text-xs font-mono">
          {format(new Date(row.timestamp), 'dd/MM HH:mm:ss', { locale: es })}
        </span>
      ),
    },
    {
      header: 'Usuario',
      accessor: (row: AccessEvent) => row.user_nombre || 'Desconocido',
    },
    {
      header: 'Aula',
      accessor: (row: AccessEvent) => row.aula_code || '—',
    },
    {
      header: 'Resultado',
      accessor: (row: AccessEvent) => (
        <Badge variant={row.result === 'SUCCESS' ? 'default' : 'destructive'}>
          {row.result === 'SUCCESS' ? 'Permitido' : 'Denegado'}
        </Badge>
      ),
    },
    {
      header: 'Método',
      accessor: (row: AccessEvent) => (
        <span className="text-xs font-medium uppercase text-slate-600">
          {METHOD_LABELS[row.method] || row.method}
        </span>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Sub-Administrador</h1>
                <p className="text-slate-500 text-sm">Gestión operativa, horarios y monitoreo</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm shrink-0 gap-1">
                    {(['today', 'week', 'month', 'year', 'custom'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => p === 'custom' ? setPeriod('custom') : handlePeriodChange(p as any)}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded-md transition-all uppercase tracking-wider",
                          period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : p === 'year' ? 'Año' : 'Personalizado'}
                      </button>
                    ))}
                  </div>

                  {period === 'custom' && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                      <input 
                        type="date" 
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                        value={dateRange?.start_date || ''}
                        onChange={(e) => setDateRange(prev => ({ start_date: e.target.value, end_date: prev?.end_date || '' }))}
                      />
                      <span className="text-slate-400 text-xs font-bold">a</span>
                      <input 
                        type="date" 
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                        value={dateRange?.end_date || ''}
                        onChange={(e) => setDateRange(prev => ({ start_date: prev?.start_date || '', end_date: e.target.value }))}
                      />
                    </div>
                  )}

                  {dashboardMode === 'interactive' && (
                    <div className="hidden lg:flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                      {DASHBOARD_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setDashboardColor(c.value)}
                          className={cn(
                            "h-6 w-6 rounded-md transition-all",
                            c.bg,
                            dashboardColor === c.value ? "ring-4 ring-offset-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="flex w-max lg:w-full h-auto p-1 bg-slate-100 rounded-xl gap-1">
                <TabsTrigger value="dashboard" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                  <Activity className="h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="enrolamiento" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                  <Users className="h-4 w-4" /> Enrolamiento
                </TabsTrigger>
                <TabsTrigger value="horarios" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                  <CalendarIcon className="h-4 w-4" /> Horarios
                </TabsTrigger>
                <TabsTrigger value="monitoreo" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                  <Clock className="h-4 w-4" /> Monitoreo
                </TabsTrigger>
                <TabsTrigger value="reportes" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all gap-2">
                  <FileText className="h-4 w-4" /> Reportes
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: DASHBOARD */}
            <TabsContent value="dashboard" className="space-y-6 pt-2">
              {kpiLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <KPICard title="Accesos Totales" value={kpiData?.total_accesos || 0} icon={Activity} description="En el periodo seleccionado" trend={kpiData?.total_accesos_trend} />
                  <KPICard title="Tasa Éxito" value={`${kpiData?.tasa_exito || 0}%`} icon={CheckCircle} className="text-emerald-600" trend={kpiData?.tasa_exito_trend} />
                  <KPICard title="Tasa Rechazo" value={`${kpiData?.tasa_rechazo || 0}%`} icon={XCircle} className="text-red-600" trend={kpiData?.tasa_rechazo_trend} />
                  <KPICard title="Alertas" value={kpiData?.alertas_activas || 0} icon={AlertTriangle} className={kpiData?.alertas_activas ? 'text-amber-500 animate-pulse' : ''} trend={kpiData?.alertas_activas_trend} />
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-lg">Flujo Horario</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={kpiData?.accesos_por_hora || kpiData?.accesos_por_dia || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="hora" axisLine={false} tickLine={false} fontSize={10} />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="cantidad" fill={dashboardColor} radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-lg">Top Aulas</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={kpiData?.top_aulas || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="aula" type="category" width={40} axisLine={false} tickLine={false} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill={dashboardColor} radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="h-5 w-5" /> Alertas Críticas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {alertasRecientes.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl italic">No hay alertas recientes que requieran revisión</div>
                  ) : (
                    alertasRecientes.map((alerta) => (
                      <div key={alerta.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50/30 border border-red-100 rounded-xl gap-3">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                            <XCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-red-900 uppercase">Intento Denegado</p>
                            <p className="text-xs text-red-700/70 font-medium">
                              {format(new Date(alerta.timestamp), 'HH:mm:ss')} · {alerta.reason || 'Sin razón especificada'}
                            </p>
                            <p className="text-[10px] mt-1 text-red-600 bg-red-100/50 px-2 py-0.5 rounded-full inline-block font-bold">
                              {METHOD_LABELS[alerta.method] || alerta.method}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs bg-white border-red-200 text-red-700 hover:bg-red-50">Gestionar Alerta</Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: ENROLAMIENTO */}
            <TabsContent value="enrolamiento">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Padrón de Usuarios</CardTitle>
                  <CardDescription>Busca personas para gestionar su biometría facial</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable data={usuarios} columns={userColumns} isLoading={usuariosLoading} searchPlaceholder="Buscar por nombre, email, DUI..." />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: HORARIOS (Teams Style) */}
            <TabsContent value="horarios" className="space-y-6 pt-2">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Calendario de Permisos</CardTitle>
                    <CardDescription>Gestiona accesos semanales por docente y aula</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => refetchPermisos()} className="gap-2">
                     <RefreshCw className="h-4 w-4" /> Sincronizar
                   </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_300px] gap-6">
                <Card className="border-none shadow-xl overflow-hidden bg-white ring-1 ring-slate-200/50">
                  {/* Calendar Headers */}
                  <div className="grid grid-cols-[70px_repeat(5,1fr)] bg-slate-50/80 backdrop-blur-md border-b sticky top-0 z-20">
                    <div className="p-4 text-[10px] font-bold text-slate-400 uppercase text-center flex items-center justify-center">GMT-6</div>
                    {DIAS_SEMANA.map((dia, i) => {
                      const isToday = new Date().getDay() === (i + 1);
                      return (
                        <div key={dia} className={`p-4 border-l transition-colors border-slate-200/60 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                          <p className={`text-[10px] font-bold uppercase text-center ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {dia}
                          </p>
                          {isToday && <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200" />}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="relative h-[650px] overflow-y-auto custom-scrollbar bg-slate-50/20">
                    {/* Time Indicator Line (Simple approximation for now) */}
                    <div className="absolute left-0 right-0 h-px bg-red-400/50 z-10 pointer-events-none flex items-center" style={{ top: `${(new Date().getHours() - 7) * 48 + (new Date().getMinutes() / 60) * 48}px` }}>
                       <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 border-2 border-white shadow-sm" />
                    </div>

                    {HORAS.map((hora) => (
                      <div key={hora} className="grid grid-cols-[70px_repeat(5,1fr)] h-12 border-b border-slate-100 group">
                        <div className="flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 bg-slate-50/30 border-r border-slate-100">{hora}:00</div>
                        {[0, 1, 2, 3, 4].map((dia) => {
                          const permsInSlot = permisosData?.results?.filter(p => 
                            p.schedule_day === dia && 
                            parseInt(p.schedule_start?.split(':')[0] || '0') === hora
                          );
                          const isToday = new Date().getDay() === (dia + 1);
                          
                          return (
                            <div 
                              key={dia} 
                              className={`border-l border-slate-100 relative group/slot transition-all duration-200 ${isToday ? 'bg-indigo-50/10' : 'hover:bg-slate-50'}`}
                              onClick={() => { setSelectedSlot({ day: dia, hour: hora }); setIsClassDialogOpen(true); }}
                            >
                              {permsInSlot?.map(p => (
                                <div 
                                  key={p.id} 
                                  className="absolute inset-x-1 inset-y-1 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-2 shadow-md border border-indigo-500/50 z-10 overflow-hidden group/item cursor-default hover:scale-[1.02] hover:shadow-lg transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black text-white truncate uppercase leading-none drop-shadow-sm">{p.user_nombre}</p>
                                      <p className="text-[8px] text-indigo-100 font-bold truncate mt-1 bg-white/10 px-1 rounded inline-block">{p.aula_code}</p>
                                    </div>
                                    <button 
                                      onClick={() => deletePermiso.mutate(p.id)} 
                                      className="h-4 w-4 bg-white/20 text-white rounded-md flex items-center justify-center opacity-0 group-hover/item:opacity-100 hover:bg-red-500 transition-all border border-white/10"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {!permsInSlot?.length && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                  <div className="h-6 w-6 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
                                    <Plus className="h-3.5 w-3.5 text-indigo-600" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="space-y-6">
                  <Card className="border-none shadow-sm bg-indigo-900 text-white">
                    <CardHeader><CardTitle className="text-sm">Guía Rápida</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-xs opacity-90">
                      <p className="flex gap-2"><CheckCircle className="h-4 w-4 shrink-0" /> Haz clic en cualquier espacio vacío para asignar un horario.</p>
                      <p className="flex gap-2"><CheckCircle className="h-4 w-4 shrink-0" /> El sistema validará automáticamente colisiones faciales.</p>
                      <p className="flex gap-2"><CheckCircle className="h-4 w-4 shrink-0" /> Los cambios se aplican inmediatamente a los dispositivos.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: MONITOREO */}
            <TabsContent value="monitoreo" className="space-y-4">
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Eventos en Tiempo Real</CardTitle>
                      <CardDescription>Monitoreo completo de ingresos y denegaciones</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <Select onValueChange={v => setEventFilters(f => ({ ...f, method: v === 'ALL' ? '' : v }))}>
                         <SelectTrigger className="w-[140px] bg-white border-slate-200">
                           <SelectValue placeholder="Método" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="ALL">Todos los Métodos</SelectItem>
                           <SelectItem value="FACE">Facial</SelectItem>
                           <SelectItem value="PIN">PIN</SelectItem>
                           <SelectItem value="OTP">OTP</SelectItem>
                           <SelectItem value="MANUAL">Manual</SelectItem>
                         </SelectContent>
                       </Select>

                       <Select onValueChange={v => setEventFilters(f => ({ ...f, result: v === 'ALL' ? '' : v }))}>
                         <SelectTrigger className="w-[140px] bg-white border-slate-200">
                           <SelectValue placeholder="Resultado" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="ALL">Todo</SelectItem>
                           <SelectItem value="SUCCESS">Permitidos</SelectItem>
                           <SelectItem value="DENIED">Denegados</SelectItem>
                         </SelectContent>
                       </Select>

                       <Button variant="outline" size="icon" onClick={() => setEventFilters({})} title="Limpiar Filtros">
                         <RefreshCw className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable data={eventos} columns={eventColumns} isLoading={eventosLoading} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: REPORTES */}
            <TabsContent value="reportes" className="space-y-6">
              <div className="flex flex-col md:flex-row items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="space-y-2 flex-1 w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rango de Fecha</Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={reportDates.start_date} onChange={e => setReportDates(d => ({ ...d, start_date: e.target.value }))} className="bg-slate-50 border-slate-200" />
                    <span className="text-slate-400">—</span>
                    <Input type="date" value={reportDates.end_date} onChange={e => setReportDates(d => ({ ...d, end_date: e.target.value }))} className="bg-slate-50 border-slate-200" />
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="secondary" className="flex-1 md:flex-none gap-2" onClick={() => exportarEventos.mutate(reportDates)} disabled={exportarEventos.isPending}>
                    {exportarEventos.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exportar CSV
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Total Accesos" value={reporteData?.total_accesos || 0} icon={FileText} description="En el periodo seleccionado" />
                <KPICard title="Éxito" value={reporteData?.accesos_permitidos || 0} icon={CheckCircle} className="text-emerald-600" />
                <KPICard title="Denegados" value={reporteData?.accesos_denegados || 0} icon={XCircle} className="text-red-500" />
                <KPICard title="Puntualidad" value={`${reporteData?.tasa_puntualidad || 0}%`} icon={Clock} />
              </div>

              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle>Informes Disponibles</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'general', name: 'Historial de Auditoría', desc: 'Registro detallado de todos los intentos con filtros aplicados' },
                    { id: 'alerts', name: 'Incidentes de Seguridad', desc: 'Resumen de denegaciones y alertas generadas por el sistema' },
                    { id: 'enrollment', name: 'Estado de Enrolamiento', desc: 'Balance de usuarios con y sin biometría activa' }
                  ].map((rep) => (
                    <div key={rep.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{rep.name}</p>
                          <p className="text-xs text-slate-500">{rep.desc}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => exportarEventos.mutate({ ...reportDates, type: rep.id })} disabled={exportarEventos.isPending}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* DIALOG: Asignar Horario/Clase */}
        <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-indigo-600 p-6 text-white">
              <DialogTitle className="flex items-center gap-3 text-xl font-black italic uppercase tracking-tighter">
                <CalendarIcon className="h-6 w-6" /> 
                Programar Acceso
              </DialogTitle>
              {selectedSlot && (
                <p className="text-indigo-100 text-xs mt-2 font-medium">
                  {DIAS_SEMANA[selectedSlot.day]}, {selectedSlot.hour}:00 — <span className="italic">{selectedSlot.hour + (newPermiso.duration || 1)}:00</span>
                </p>
              )}
            </div>
            
            <div className="p-6 space-y-6 bg-white">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Docente a Cargo
                </Label>
                <Select onValueChange={v => setNewPermiso(p => ({ ...p, user: v }))}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                    <SelectValue placeholder="Buscar por nombre o email..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{u.nombre} {u.apellido}</span>
                          <span className="text-[10px] text-slate-500">{u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                  <DoorOpen className="h-3.5 w-3.5" /> Aula / Puerta Asignada
                </Label>
                <Select onValueChange={v => setNewPermiso(p => ({ ...p, aula: v }))}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                    <SelectValue placeholder="Seleccionar recinto físico..." />
                  </SelectTrigger>
                  <SelectContent>
                    {aulasData?.results?.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} — {a.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Duración de la Sesión
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(h => (
                    <Button 
                      key={h} 
                      type="button"
                      variant={newPermiso.duration === h ? 'default' : 'outline'}
                      className={`h-11 font-bold ${newPermiso.duration === h ? 'bg-indigo-600 shadow-md ring-2 ring-indigo-500 ring-offset-2' : 'bg-white hover:bg-slate-50'}`}
                      onClick={() => setNewPermiso(p => ({ ...p, duration: h }))}
                    >
                      {h}h
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="ghost" className="flex-1 h-12 text-slate-500" onClick={() => setIsClassDialogOpen(false)}>Descartar</Button>
                <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 font-bold uppercase text-xs tracking-widest" onClick={handleCreateSchedule} disabled={createHorario.isPending || createPermiso.isPending}>
                  {createHorario.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} 
                  {createHorario.isPending ? 'Procesando...' : 'Confirmar Registro'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: Biometría */}
        {/* ... (Keep existing biometría dialog as is) ... */}
        <Dialog open={isBioDialogOpen} onOpenChange={setIsBioDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enrolar Biometría</DialogTitle>
              {selectedUser && (
                <CardDescription>
                  Iniciando enrolamiento para: <span className="font-bold text-slate-900">{selectedUser.nombre} {selectedUser.apellido}</span>
                </CardDescription>
              )}
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-4">
                <label 
                  htmlFor="bio-upload-sub"
                  className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-8 hover:bg-blue-50 hover:border-blue-400 transition-all group"
                >
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-blue-700">Presiona para elegir archivos</span>
                  <p className="text-xs text-blue-500 mt-1">Recomendado: 3 fotos de frente</p>
                  <input 
                    id="bio-upload-sub"
                    type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleFileChange(e.target.files)} 
                  />
                </label>

                {bioPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {bioPreviews.map((url, idx) => (
                      <div key={url} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100 group">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeBioFile(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative text-center text-xs font-medium text-slate-500 py-2">
                <span className="bg-white px-2 relative z-10">O usar cámara web</span>
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              </div>

              <WebcamCapture onSave={(files) => handleFileChange(files)} maxPhotos={3} />
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsBioDialogOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={handleBioSubmit} 
                  disabled={enrolarBiometria.isPending || (bioFiles.length === 0 && bioPreviews.length === (biometricsData?.results?.[0]?.storage_url ? 1 : 0))}
                >
                  {enrolarBiometria.isPending ? 'Procesando...' : 'Guardar Biometría'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
