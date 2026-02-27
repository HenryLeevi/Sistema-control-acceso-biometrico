'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHorarios, useCreateHorario } from '@/lib/api-hooks';
import { Horario } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export default function HorariosPage() {
  const { data, isLoading } = useHorarios();
  const createHorario = useCreateHorario();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fin: '10:00',
    descripcion: '',
  });

  const horarios = data?.results || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHorario.mutateAsync(formData);
      toast({ title: 'Horario creado correctamente' });
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
      dia_semana: 1,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      descripcion: '',
    });
  };

  const getDiaNombre = (dia: number) => {
    return DIAS_SEMANA.find(d => d.value === dia)?.label || 'N/A';
  };

  const columns = [
    {
      header: 'Día',
      accessor: (row: Horario) => (
        <div className="font-medium">{getDiaNombre(row.dia_semana)}</div>
      ),
    },
    {
      header: 'Hora Inicio',
      accessor: 'hora_inicio' as keyof Horario,
    },
    {
      header: 'Hora Fin',
      accessor: 'hora_fin' as keyof Horario,
    },
    {
      header: 'Descripción',
      accessor: (row: Horario) => row.descripcion || '-',
    },
  ];

  return (
    <RoleGuard allowedRoles={['admin', 'subadmin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Horarios</h1>
              <p className="text-slate-600 mt-1">Gestión de franjas horarias</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Horario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Horario</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dia">Día de la Semana</Label>
                    <Select
                      value={String(formData.dia_semana)}
                      onValueChange={(value) => setFormData({ ...formData, dia_semana: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAS_SEMANA.map(dia => (
                          <SelectItem key={dia.value} value={String(dia.value)}>
                            {dia.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hora_inicio">Hora Inicio</Label>
                      <Input
                        id="hora_inicio"
                        type="time"
                        value={formData.hora_inicio}
                        onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora_fin">Hora Fin</Label>
                      <Input
                        id="hora_fin"
                        type="time"
                        value={formData.hora_fin}
                        onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                    <Input
                      id="descripcion"
                      placeholder="Ej: Turno Mañana"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createHorario.isPending}>
                      {createHorario.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            data={horarios}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar horarios..."
          />
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
