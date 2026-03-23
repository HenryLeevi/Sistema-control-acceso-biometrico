'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsuarios, useAulas } from '@/lib/api-hooks';
import { User, Aula, PaginatedResponse } from '@/lib/types';
import { Loader2, Trash2, Clock, Calendar as CalendarIcon, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialData?: {
    id?: string;
    user?: string;
    aula?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_anytime: boolean;
  };
}

export function CalendarEventModal({ isOpen, onClose, onSave, onDelete, initialData }: CalendarEventModalProps) {
  const [formData, setFormData] = useState({
    user: '',
    aula: '',
    is_anytime: false,
    day_of_week: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    is_recurring: true,
    start_time: '08:00',
    end_time: '09:00',
  });

  const { data: usuariosData, isLoading: loadingUsers } = useUsuarios();
  const { data: aulasData, isLoading: loadingAulas } = useAulas();

  const usuarios = usuariosData?.results || [];
  const aulas = aulasData?.results || [];

  useEffect(() => {
    if (initialData) {
      setFormData({
        user: initialData.user || '',
        aula: initialData.aula || '',
        is_anytime: initialData.is_anytime || false,
        day_of_week: initialData.day_of_week ?? 0,
        date: (initialData as any).schedule_date || format(new Date(), 'yyyy-MM-dd'),
        is_recurring: (initialData as any).schedule_is_recurring !== undefined ? (initialData as any).schedule_is_recurring : true,
        start_time: initialData.start_time?.slice(0,5) || '08:00',
        end_time: initialData.end_time?.slice(0,5) || '09:00',
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!formData.user || !formData.aula) return;
    onSave({
      ...initialData,
      ...formData,
      // Ensure times are in HH:MM:SS format for backend if necessary
      start_time: `${formData.start_time}:00`,
      end_time: `${formData.end_time}:00`,
    });
  };

  const handleSaveAsNew = () => {
    if (!formData.user || !formData.aula) return;
    const { id, ...dataWithoutId } = initialData || {};
    onSave({
      ...dataWithoutId,
      ...formData,
      start_time: `${formData.start_time}:00`,
      end_time: `${formData.end_time}:00`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initialData?.id ? 'Editar Horario' : 'Nuevo Horario'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Docente / Usuario</Label>
              <Select value={formData.user} onValueChange={v => setFormData({ ...formData, user: v })}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Seleccionar docente..." />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u: User) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                      <span className="ml-1 text-[10px] text-slate-400 font-normal uppercase tracking-tight">({u.roles?.join(', ') || 'USUARIO'})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Aula / Puerta</Label>
              <Select value={formData.aula} onValueChange={v => setFormData({ ...formData, aula: v })}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Seleccionar recinto..." />
                </SelectTrigger>
                <SelectContent>
                  {aulas.map((a: Aula) => (
                    <SelectItem key={a.id} value={a.id}>{a.code} - {a.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between">
              <Label htmlFor="anytime" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                Acceso Permanente
              </Label>
              <input 
                type="checkbox"
                id="anytime" 
                checked={formData.is_anytime}
                onChange={(e) => setFormData(prev => ({ ...prev, is_anytime: e.target.checked }))}
                className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2">
                <RotateCw className={cn("h-4 w-4 text-slate-400", formData.is_recurring && "text-blue-500 animate-spin-slow")} />
                <Label htmlFor="recurring" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Repetir semanalmente
                </Label>
              </div>
              <input 
                type="checkbox"
                id="recurring" 
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full opacity-40" />
            
            <div className="space-y-4 relative z-10">
              {formData.is_recurring ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Día de la Semana
                  </Label>
                  <Select 
                    value={String(formData.day_of_week)} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, day_of_week: parseInt(v) }))}
                  >
                    <SelectTrigger className="bg-white border-slate-200 h-11 focus:ring-indigo-500 focus:border-indigo-500">
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                        <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" /> Fecha (DD/MM/AAAA)
                  </Label>
                  <Input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-white border-slate-200 h-11 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    placeholder="DD/MM/AAAA"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 italic pl-1">Selecciona la fecha específica en el calendario</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                    Desde
                    <span className="text-[9px] text-indigo-400 font-bold">INICIO</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      className="bg-white border-slate-200 h-11 font-mono text-sm pl-9"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                    Hasta
                    <span className="text-[9px] text-red-400 font-bold">FIN</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                      className="bg-white border-slate-200 h-11 font-mono text-sm pl-9"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!formData.user || !formData.aula}
              className="w-full h-12 bg-[#171717] text-white hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold text-base"
            >
              {initialData?.id ? 'Guardar' : 'Crear Horario'}
            </Button>
            
            <div className={cn(
              "grid gap-2",
              initialData?.id ? "grid-cols-2" : "grid-cols-1"
            )}>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                type="button"
              >
                Cancelar
              </Button>
              {initialData?.id && (
                <Button 
                  variant="secondary"
                  onClick={handleSaveAsNew}
                  disabled={!formData.user || !formData.aula}
                  className="w-full h-11 bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 font-semibold"
                  type="button"
                >
                  Duplicar
                </Button>
              )}
            </div>

            {initialData?.id && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete?.(initialData.id!)}
                className="w-full h-11 text-red-500 hover:text-red-600 hover:bg-red-50 mt-1"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar Horario
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
