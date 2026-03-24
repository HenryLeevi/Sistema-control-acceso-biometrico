import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, icon: Icon, description, className, trend }: KPICardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow min-w-0 flex flex-col h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-1.5 lg:pb-2 lg:pt-6 lg:px-6">
        <CardTitle className="text-[8px] sm:text-[10px] lg:text-sm font-medium text-slate-600 truncate">{title}</CardTitle>
        <Icon className="hidden sm:block h-3 w-3 lg:h-4 lg:w-4 text-slate-500 shrink-0" />
      </CardHeader>
      <CardContent className="px-1.5 pb-2 lg:px-6 lg:pb-6">
        <div className="text-sm sm:text-lg lg:text-2xl font-bold text-slate-900 truncate">{value}</div>
        {trend && (
          <p className={cn(
            "text-[7px] sm:text-[9px] lg:text-xs mt-0 lg:mt-1 font-medium truncate",
            trend.isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            {trend.isPositive ? '+' : '-'}{trend.value}% <span className="hidden sm:inline">vs ant.</span>
          </p>
        )}
        {description && (
          <p className="hidden sm:block text-[9px] lg:text-xs text-slate-500 mt-0.5 lg:mt-1 truncate">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
