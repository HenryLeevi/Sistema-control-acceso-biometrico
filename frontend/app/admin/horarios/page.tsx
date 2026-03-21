'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHorarios, useCreateHorario, useUpdateHorario, useDeleteHorario } from '@/lib/api-hooks';
import { Schedule } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAMPM } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const DIAS = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
  { value: '6', label: 'Domingo' },
];

const getDiaLabel = (num: number) => DIAS[num]?.label ?? `Día ${num}`;

const emptyForm = { day_of_week: '1', start_time: '07:00', end_time: '08:00' };

export default function HorariosPage() {
  const { data, isLoading } = useHorarios();
  const createHorario = useCreateHorario();
  const updateHorario = useUpdateHorario();
  const deleteHorario = useDeleteHorario();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [itemToDelete, setItemToDelete] = useState<Schedule | null>(null);

  const horarios = data?.results || [];
  const isPending = createHorario.isPending || updateHorario.isPending;

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setIsDialogOpen(true); };
  const openEdit = (h: Schedule) => {
    setEditing(h);
    setFormData({
      day_of_week: String(h.day_of_week),
      start_time: h.start_time.slice(0, 5),
      end_time: h.end_time.slice(0, 5),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      day_of_week: parseInt(formData.day_of_week),
      start_time: formData.start_time,
      end_time: formData.end_time,
    };
    try {
      if (editing) {
        await updateHorario.mutateAsync({ id: editing.id, data: payload });
        toast({ title: 'Horario actualizado' });
      } else {
        await createHorario.mutateAsync(payload);
        toast({ title: 'Horario creado' });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el horario', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteHorario.mutateAsync(itemToDelete.id);
      toast({ title: 'Horario eliminado' });
      setItemToDelete(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const columns = [
    {
      header: 'Día',
      accessor: (row: Schedule) => <span className="font-medium">{getDiaLabel(row.day_of_week)}</span>,
    },
    {
      header: 'Hora inicio',
      accessor: (row: Schedule) => <span className="font-mono">{formatTimeAMPM(row.start_time)}</span>,
    },
    {
      header: 'Hora fin',
      accessor: (row: Schedule) => <span className="font-mono">{formatTimeAMPM(row.end_time)}</span>,
    },
    {
      header: 'Acciones',
      accessor: (row: Schedule) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-red-500" onClick={() => setItemToDelete(row)}>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Horarios</h1>
              <p className="text-slate-600 mt-1">Ventanas de tiempo para el control de acceso</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Horario
            </Button>
          </div>

          <DataTable data={horarios} columns={columns} isLoading={isLoading} searchPlaceholder="Buscar horarios..." />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Horario' : 'Nuevo Horario'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Día de la semana</Label>
                <Select value={formData.day_of_week}
                  onValueChange={v => setFormData({ ...formData, day_of_week: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIAS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Hora inicio</Label>
                    {formData.start_time && <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formatTimeAMPM(formData.start_time)}</span>}
                  </div>
                  <Input type="time" value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Hora fin</Label>
                    {formData.end_time && <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formatTimeAMPM(formData.end_time)}</span>}
                  </div>
                  <Input type="time" value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })} required />
                </div>
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
                ¿Estás seguro de que deseas eliminar este horario (<strong>{getDiaLabel(itemToDelete?.day_of_week || 0)} {formatTimeAMPM(itemToDelete?.start_time || '')} - {formatTimeAMPM(itemToDelete?.end_time || '')}</strong>)?
              </p>
              <p className="text-xs text-red-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteHorario.isPending}>
                {deleteHorario.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RoleGuard>
  );
}
