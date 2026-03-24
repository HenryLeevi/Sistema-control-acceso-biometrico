'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { RoleGuard } from '@/components/role-guard';
import { KPICard } from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useReporte, useExportarEventos, useExportarExcel } from '@/lib/api-hooks';
import { Activity, CheckCircle, XCircle, Clock, Download, FileText, RefreshCw, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function ReportesPage() {
  const [reportDates, setReportDates] = useState({ 
    start_date: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd') 
  });
  
  const [appliedDates, setAppliedDates] = useState(reportDates);

  const { data: reporteData, isLoading: reporteLoading, refetch } = useReporte(appliedDates);
  const exportarEventos = useExportarEventos();
  const exportarExcel = useExportarExcel();

  const handleFilter = () => {
    setAppliedDates(reportDates);
    refetch();
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUBADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Centro de Reportes</h1>
                <p className="text-slate-500 text-sm">Exportación y auditoría de accesos</p>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Generar Reporte de Auditoría</CardTitle>
                    <CardDescription>Seleccione un rango de fechas y presione filtrar antes de exportar</CardDescription>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <RefreshCw className={`h-3 w-3 ${reporteLoading ? 'animate-spin' : ''}`} />
                  {reporteLoading ? 'Actualizando...' : 'Datos Sincronizados'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-6 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> 1. Seleccionar Rango de Fechas
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="date" 
                      className="h-11 shadow-sm border-slate-200 focus:ring-indigo-500" 
                      value={reportDates.start_date} 
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => setReportDates(d => ({ ...d, start_date: e.target.value }))} 
                    />
                    <div className="h-px w-4 bg-slate-300 shrink-0" />
                    <Input 
                      type="date" 
                      className="h-11 shadow-sm border-slate-200 focus:ring-indigo-500" 
                      value={reportDates.end_date} 
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => setReportDates(d => ({ ...d, end_date: e.target.value }))} 
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Button 
                    variant="secondary"
                    className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
                    onClick={handleFilter}
                    disabled={reporteLoading}
                  >
                    {reporteLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    2. Filtrar
                  </Button>
                </div>

                <div className="md:col-span-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-11 border-slate-200 hover:bg-slate-50 font-bold"
                    onClick={() => exportarEventos.mutate(appliedDates)}
                    disabled={exportarEventos.isPending || reporteLoading}
                  >
                    {exportarEventos.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2 text-slate-500" />}
                    CSV
                  </Button>
                  <Button 
                    className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold"
                    onClick={() => exportarExcel.mutate(appliedDates)}
                    disabled={exportarExcel.isPending || reporteLoading}
                  >
                    {exportarExcel.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KPICard title="Total Registros" value={reporteData?.total_accesos || 0} icon={Activity} />
            <KPICard title="Accesos Exitosos" value={reporteData?.accesos_permitidos || 0} icon={CheckCircle} className="text-emerald-600" />
            <KPICard title="Accesos Denegados" value={reporteData?.accesos_denegados || 0} icon={XCircle} className="text-red-500" />
            <KPICard title="Tasa Puntualidad" value={`${reporteData?.tasa_puntualidad || 0}%`} icon={Clock} />
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
