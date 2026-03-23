'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHorarios, usePermissions, useDeletePermission, useUpsertCalendarEvent } from '@/lib/api-hooks';
import { Schedule, AccessPermission } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { WeeklyCalendar } from '@/components/weekly-calendar';
import { CalendarEventModal } from '@/components/calendar-event-modal';

// Remove local DIAS and emptyForm constants as they are now handled by the unified modal

export default function HorariosPage() {
  const { data: permissionsData } = usePermissions();
  const upsertEvent = useUpsertCalendarEvent();
  const deletePermission = useDeletePermission();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [showPermanent, setShowPermanent] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const openCreate = () => { setSelectedPermission(null); setIsModalOpen(true); };
  
  const handleSave = async (data: any) => {
    try {
      await upsertEvent.mutateAsync(data);
      toast({ title: 'Éxito', description: 'El horario ha sido guardado correctamente.' });
      setIsModalOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el horario.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) return;
    try {
      await deletePermission.mutateAsync(id);
      toast({ title: 'Eliminado', description: 'El horario ha sido eliminado.' });
      setIsModalOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el horario.', variant: 'destructive' });
    }
  };

  const confirmDeletePermission = async (p: AccessPermission) => {
    if (!confirm(`¿Estás seguro de que deseas revocar el acceso permanente para ${p.user_nombre}?`)) return;
    try {
      await deletePermission.mutateAsync(p.id);
      toast({ title: 'Acceso revocado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };


  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex"
              >
                {isSidebarOpen ? 'Ocultar Panel' : 'Mostrar Panel'}
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Nuevo Horario
              </Button>
            </div>
          </div>

          <div className={cn(
            "grid grid-cols-1 gap-6 h-[calc(100vh-250px)] transition-all duration-300",
            isSidebarOpen ? "lg:grid-cols-4" : "lg:grid-cols-1"
          )}>
            <div className={cn("h-full", isSidebarOpen ? "lg:col-span-3" : "lg:col-span-1")}>
              <WeeklyCalendar permissions={permissionsData?.results || []} />
            </div>
            {isSidebarOpen && (
              <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 animate-in slide-in-from-right-4 duration-300">
                {showPermanent && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                        Acceso Permanente
                      </h3>
                      <button 
                        onClick={() => setShowPermanent(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Usuarios con acceso total sin restricciones de horario.</p>

                    <div className="space-y-2">
                      {permissionsData?.results.filter(p => p.schedule_is_anytime).length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                          <p className="text-xs text-slate-400">No hay accesos permanentes</p>
                        </div>
                      ) : (
                        permissionsData?.results
                          .filter(p => p.schedule_is_anytime)
                          .map(p => (
                            <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-slate-900 truncate">{p.user_nombre}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{p.aula_code} — {p.aula_description}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => confirmDeletePermission(p)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
                {!showPermanent && (
                  <button 
                    onClick={() => setShowPermanent(true)}
                    className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 rounded-lg transition-all"
                  >
                    Mostrar lista de acceso permanente
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <CalendarEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
          initialData={selectedPermission}
        />
      </AdminLayout>
    </RoleGuard>
  );
}
