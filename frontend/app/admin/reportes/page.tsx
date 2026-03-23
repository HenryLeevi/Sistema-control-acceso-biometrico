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

  const { data: reporteData, isLoading: reporteLoading } = useReporte(reportDates);
  const exportarEventos = useExportarEventos();
  const exportarExcel = useExportarExcel();

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
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Generar Reporte de Auditoría</CardTitle>
                  <CardDescription>Seleccione un rango de fechas para exportar los eventos detectados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Rango seleccionado
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="date" 
                      className="h-11 shadow-sm border-slate-200 focus:ring-indigo-500" 
                      value={reportDates.start_date} 
                      onChange={e => setReportDates(d => ({ ...d, start_date: e.target.value }))} 
                    />
                    <div className="h-px w-4 bg-slate-300 shrink-0" />
                    <Input 
                      type="date" 
                      className="h-11 shadow-sm border-slate-200 focus:ring-indigo-500" 
                      value={reportDates.end_date} 
                      onChange={e => setReportDates(d => ({ ...d, end_date: e.target.value }))} 
                    />
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
