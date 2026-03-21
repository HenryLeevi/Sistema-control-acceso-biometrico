import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, LayoutTemplate } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface DynamicChartProps {
  type: string;
  data: any;
  onRemove: () => void;
}

export function DynamicChart({ type, data, onRemove }: DynamicChartProps) {
  // Determine allowed combinations and defaults based on semantic metric types
  let allowedViews: ('bar' | 'line' | 'pie' | 'kpi')[] = [];
  let defaultView: 'bar' | 'line' | 'pie' | 'kpi' = 'bar';

  let title = '';
  let chartData: any[] = [];
  let isPercentage = false;
  let scalarValue = 0;
  let scalarLabel = '';

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];

  switch (type) {
    case 'accesos_hoy':
      allowedViews = ['bar', 'line', 'pie'];
      defaultView = 'bar';
      title = `Accesos por Hora (Hoy)`;
      chartData = (data?.accesos_por_hora || []).map((d: any) => ({ name: d.hora, value: d.cantidad }));
      break;

    case 'tasa_exito':
    case 'tasa_rechazo':
      const isExito = type === 'tasa_exito';
      allowedViews = ['pie', 'kpi', 'bar'];
      defaultView = 'pie';
      title = isExito ? 'Tasa de Éxito' : 'Tasa de Rechazo';
      scalarValue = isExito ? (data?.tasa_exito || 0) : (data?.tasa_rechazo || 0);
      scalarLabel = isExito ? 'Accesos Permitidos' : 'Accesos Denegados';
      isPercentage = true;
      chartData = [
        { name: isExito ? 'Éxito' : 'Rechazo', value: scalarValue, fill: isExito ? '#10b981' : '#f43f5e' },
        { name: 'Resto', value: 100 - scalarValue, fill: '#f1f5f9' }
      ];
      break;

    case 'top_aulas':
      allowedViews = ['bar', 'pie'];
      defaultView = 'bar';
      title = 'Top Aulas (Accesos)';
      chartData = (data?.top_aulas || []).map((d: any, idx: number) => ({ name: d.aula, value: d.cantidad, fill: COLORS[idx % COLORS.length] }));
      break;

    case 'alertas':
    case 'usuarios':
      const isAlertas = type === 'alertas';
      allowedViews = ['kpi', 'pie', 'bar'];
      defaultView = 'kpi';
      title = isAlertas ? 'Alertas Activas' : 'Usuarios Activos';
      scalarValue = isAlertas ? (data?.alertas_activas || 0) : (data?.usuarios_activos || 0);
      scalarLabel = isAlertas ? 'Requieren revisión' : 'Registrados con acceso';
      chartData = [
        { name: title, value: scalarValue, fill: isAlertas ? '#f59e0b' : '#3b82f6' },
      ];
      break;
  }

  const [viewType, setViewType] = useState<'bar' | 'line' | 'pie' | 'kpi'>(defaultView);

  // Render icons for view switcher
  const renderViewIcon = (view: string) => {
    switch (view) {
      case 'bar': return <BarChart2 className="w-3.5 h-3.5" />;
      case 'line': return <LineChartIcon className="w-3.5 h-3.5" />;
      case 'pie': return <PieChartIcon className="w-3.5 h-3.5" />;
      case 'kpi': return <LayoutTemplate className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <Card className={cn(
      "relative group shadow-sm hover:shadow-lg transition-all duration-300 h-full overflow-hidden flex flex-col",
      viewType === 'kpi' && type.match(/alertas|usuarios/) ? "bg-[#0B1121] text-white border-slate-800" : "bg-white border-slate-200"
    )}>
      
      {viewType === 'kpi' && type.match(/alertas|usuarios/) && (
        <div className="absolute -right-10 -top-10 h-32 w-32 bg-gradient-to-br from-indigo-500/20 to-blue-500/0 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header with Title and Switcher */}
      <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0 space-y-0">
        <CardTitle className={cn(
          "text-sm font-bold",
          viewType === 'kpi' && type.match(/alertas|usuarios/) ? "text-slate-400 uppercase tracking-widest text-[10px]" : "text-slate-700"
        )}>
          {title}
        </CardTitle>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {allowedViews.map((view) => (
            <Button 
              key={view} 
              variant="ghost" 
              size="icon" 
              className={cn("h-6 w-6 rounded-md", viewType === view ? "bg-slate-200/50 text-blue-600" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setViewType(view)}
              title={`Vista de ${view}`}
            >
              {renderViewIcon(view)}
            </Button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onRemove} title="Cerrar Gráfico">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {viewType === 'kpi' && (
           <div className="flex flex-col items-center justify-center h-48 w-full text-center">
             <div className={cn(
               "text-7xl font-black bg-clip-text text-transparent py-2",
               type.match(/alertas|usuarios/) 
                 ? "bg-gradient-to-br from-white to-slate-500" 
                 : "bg-gradient-to-br from-blue-600 to-indigo-600"
             )}>
               {scalarValue}{isPercentage ? '%' : ''}
             </div>
             <p className={cn(
               "text-xs font-medium uppercase tracking-wide mt-2",
               type.match(/alertas|usuarios/) ? "text-slate-400" : "text-slate-500"
             )}>
               {scalarLabel}
             </p>
           </div>
        )}

        {viewType === 'bar' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout={type === 'top_aulas' ? 'vertical' : 'horizontal'}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={type !== 'top_aulas'} stroke="#e2e8f0" />
              <XAxis dataKey={type === 'top_aulas' ? 'value' : 'name'} type={type === 'top_aulas' ? 'number' : 'category'} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey={type === 'top_aulas' ? 'name' : 'value'} type={type === 'top_aulas' ? 'category' : 'number'} width={type === 'top_aulas' ? 80 : 40} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#1e293b' }} />
              <Bar dataKey="value" radius={type === 'top_aulas' ? [0,4,4,0] : [4,4,0,0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewType === 'line' && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#1e293b' }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {viewType === 'pie' && (
          <div className="relative w-full h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={isPercentage ? 65 : 40} outerRadius={isPercentage ? 85 : 80} paddingAngle={isPercentage ? 5 : 2} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {isPercentage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1 text-slate-800">
                <span className="text-3xl font-black">{scalarValue.toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
