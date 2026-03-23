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
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  onResize?: (newSize: 'sm' | 'md' | 'lg') => void;
}

export function DynamicChart({ type, data, onRemove, primaryColor = '#3b82f6', size = 'sm', onResize }: DynamicChartProps) {
  // Determine allowed combinations and defaults based on semantic metric types
  let allowedViews: ('bar' | 'line' | 'pie' | 'kpi')[] = [];
  let defaultView: 'bar' | 'line' | 'pie' | 'kpi' = 'bar';

  let title = '';
  let chartData: any[] = [];
  let isPercentage = false;
  let scalarValue = 0;
  let scalarLabel = '';

  const COLORS = [primaryColor, '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];

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
    case 'falsos_negativos':
    case 'uso_otp':
      const isAlertas = type === 'alertas';
      const isUsuarios = type === 'usuarios';
      const isFalsos = type === 'falsos_negativos';
      const isOTP = type === 'uso_otp';
      
      allowedViews = ['kpi', 'pie', 'bar'];
      defaultView = 'kpi';
      
      if (isAlertas) { title = 'Alertas Activas'; scalarValue = data?.alertas_activas || 0; scalarLabel = 'Requieren revisión'; }
      else if (isUsuarios) { title = 'Usuarios Activos'; scalarValue = data?.usuarios_activos || 0; scalarLabel = 'Registrados'; }
      else if (isFalsos) { title = 'Falsos Negativos'; scalarValue = data?.falsos_negativos || 0; scalarLabel = 'Identificación fallida'; }
      else if (isOTP) { title = 'Uso de OTP'; scalarValue = data?.uso_otp || 0; scalarLabel = 'Accesos vía código'; }
      
      chartData = [{ name: title, value: scalarValue, fill: isAlertas || isFalsos ? '#f59e0b' : primaryColor }];
      break;

    case 'score_promedio':
      allowedViews = ['kpi', 'bar', 'line'];
      defaultView = 'kpi';
      title = 'Score Promedio';
      scalarValue = data?.score_promedio || 0;
      scalarLabel = 'Confianza biométrica (%)';
      isPercentage = true;
      chartData = [{ name: title, value: scalarValue, fill: '#8b5cf6' }];
      break;

    case 'tiempo_respuesta':
      allowedViews = ['kpi', 'bar', 'line'];
      defaultView = 'kpi';
      title = 'Tiempo Respuesta';
      scalarValue = data?.tiempo_respuesta_promedio || 0;
      scalarLabel = 'Promedio (segundos)';
      chartData = [{ name: title, value: scalarValue, fill: '#64748b' }];
      break;

    case 'accesos_por_metodo':
      allowedViews = ['bar', 'pie', 'kpi'];
      defaultView = 'bar';
      title = 'Accesos por Método';
      chartData = (data?.accesos_por_metodo || []).map((d: any, idx: number) => ({
        name: d.metodo,
        value: d.cantidad,
        fill: COLORS[idx % COLORS.length]
      }));
      // For KPI view of this category, show the top method
      if (chartData.length > 0) {
        const top = [...chartData].sort((a, b) => b.value - a.value)[0];
        scalarValue = top.value;
        scalarLabel = `Top: ${top.name}`;
      } else {
        scalarValue = 0;
        scalarLabel = 'Sin datos';
      }
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

  const chartHeight = size === 'sm' ? 160 : size === 'md' ? 220 : 300;

  return (
    <Card className={cn(
      "relative group shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col min-w-0 bg-white border-slate-200 rounded-xl",
      size === 'sm' ? "h-[260px]" : size === 'md' ? "h-[340px]" : "h-[440px]"
    )}>
      
      <div 
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl pointer-events-none opacity-40" 
        style={{ backgroundColor: primaryColor }}
      />

              <CardHeader className={cn(
                "flex flex-row items-center justify-between shrink-0 space-y-0 bg-slate-50/50 border-b border-slate-100 transition-colors group-hover:bg-slate-100/50",
                size === 'sm' ? "px-3 py-1.5" : "px-4 py-2"
              )}>
                <CardTitle className={cn(
                  "font-black truncate mr-2 tracking-tight transition-all",
                  size === 'sm' ? (title.length > 15 ? "text-[9px]" : "text-[10px]") : "text-sm",
                  "text-slate-700"
                )}>
                  {title}
                </CardTitle>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shrink-0">
                  <div className="flex bg-white/80 backdrop-blur-sm rounded-full p-0.5 border border-slate-200 shadow-sm scale-90 origin-right transition-transform group-hover:scale-100">
                    {(['sm', 'md', 'lg'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => onResize?.(s)}
                        className={cn(
                          "px-2 py-0.5 text-[8px] font-black uppercase rounded-full transition-all",
                          size === s ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-white/80 backdrop-blur-sm rounded-full p-0.5 border border-slate-200 shadow-sm scale-90 origin-right transition-transform group-hover:scale-100">
                    {allowedViews.map((view) => (
                      <Button 
                        key={view} 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-5 w-5 rounded-full transition-all", 
                          viewType === view ? "bg-slate-100" : "text-slate-400 hover:text-slate-600"
                        )}
                        style={viewType === view ? { color: primaryColor } : {}}
                        onClick={() => setViewType(view)}
                      >
                        {renderViewIcon(view)}
                      </Button>
                    ))}
                  </div>
                  
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={onRemove}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

      <CardContent className={cn(
        "flex-1 flex flex-col items-center justify-center relative overflow-hidden",
        size === 'sm' ? "p-4" : "p-6"
      )}>
        {viewType === 'kpi' && (
             <div className="flex flex-col items-center justify-center flex-1">
               <div className={cn(
                 "font-black bg-clip-text text-transparent py-1 tracking-tighter drop-shadow-sm transition-all animate-in zoom-in duration-300",
                  size === 'sm' ? "text-5xl" : size === 'md' ? "text-7xl" : "text-8xl",
                  "bg-clip-text text-transparent"
                )}
                style={{ backgroundImage: `linear-gradient(to bottom right, ${primaryColor}, #1e3a8a)` }}
                >
                  {scalarValue}{isPercentage ? '%' : ''}
                </div>
                
                {/* Trend indicator for Interactive mode */}
                {data?.[`${type}_trend` as keyof typeof data] && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1",
                    (data as any)[`${type}_trend`].isPositive 
                      ? "bg-emerald-50 text-emerald-600" 
                      : "bg-red-50 text-red-600"
                  )}>
                    {(data as any)[`${type}_trend`].isPositive ? '↑' : '↓'}
                    {(data as any)[`${type}_trend`].value}%
                    <span className="opacity-60 font-medium">vs prev</span>
                  </div>
                )}

                <p className={cn(
                  "font-black uppercase tracking-[0.2em] mt-2",
                  size === 'sm' ? "text-[8px]" : "text-[10px]",
                  "text-slate-500"
                )}>
                 {scalarLabel}
               </p>
             </div>
        )}

        {viewType === 'bar' && (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout={type === 'top_aulas' ? 'vertical' : 'horizontal'}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={type !== 'top_aulas'} stroke="#f1f5f9" />
              <XAxis 
                dataKey={type === 'top_aulas' ? 'value' : 'name'} 
                type={type === 'top_aulas' ? 'number' : 'category'} 
                fontSize={size === 'sm' ? 8 : 10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
                tick={{fill: '#94a3b8'}} 
              />
              <YAxis 
                dataKey={type === 'top_aulas' ? 'name' : 'value'} 
                type={type === 'top_aulas' ? 'category' : 'number'} 
                width={type === 'top_aulas' ? (size === 'sm' ? 50 : 80) : (size === 'sm' ? 25 : 35)} 
                fontSize={size === 'sm' ? 8 : 10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
                tick={{fill: '#94a3b8'}} 
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Bar dataKey="value" radius={type === 'top_aulas' ? [0,6,6,0] : [6,6,0,0]} maxBarSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || primaryColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewType === 'line' && (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                fontSize={size === 'sm' ? 8 : 10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
                tick={{fill: '#94a3b8'}} 
              />
              <YAxis 
                fontSize={size === 'sm' ? 8 : 10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
                width={size === 'sm' ? 25 : 35} 
                tick={{fill: '#94a3b8'}} 
              />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {viewType === 'pie' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie data={chartData} innerRadius={isPercentage ? (chartHeight/3) : (chartHeight/4)} outerRadius={isPercentage ? (chartHeight/2.2) : (chartHeight/2.5)} paddingAngle={isPercentage ? 5 : 2} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {isPercentage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className={cn("font-black text-slate-800 tracking-tighter", size === 'sm' ? "text-xl" : "text-2xl")}>{scalarValue.toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
