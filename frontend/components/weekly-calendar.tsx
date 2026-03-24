'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEventModal } from './calendar-event-modal';
import { useUpsertCalendarEvent, useDeletePermission } from '@/lib/api-hooks';
import { AccessPermission, Aula, User } from '@/lib/types';
import { format, addMinutes, startOfDay, parse, addWeeks, subWeeks, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Pencil, GripVertical, MoreVertical, Clock, MapPin, User as UserIcon, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 25; // 30 mins = 25px, 1 hour = 50px

interface WeeklyCalendarProps {
  permissions: AccessPermission[];
  readOnly?: boolean;
}

export function WeeklyCalendar({ permissions, readOnly }: WeeklyCalendarProps) {
  const [now, setNow] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selection, setSelection] = useState<{ day: number; start: number; end: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [dragButton, setDragButton] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  
  const [draggingEvent, setDraggingEvent] = useState<{ id: string; originalDay: number; originalStart: number; originalEnd: number; type: 'move' | 'resize' } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { mutate: upsertEvent } = useUpsertCalendarEvent();
  const { mutate: deletePermission } = useDeletePermission();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (draggingEvent && selection && hasMoved) {
        // Find the event to update
        const p = permissions.find(x => x.id === draggingEvent.id);
        if (p) {
          const formatTime = (v: number) => {
            const h = Math.min(Math.floor(v), 23);
            const m = v >= 24 ? '59' : ((v % 1) >= 0.5 ? '30' : '00');
            return `${String(h).padStart(2, '0')}:${m}:00`;
          };
          upsertEvent({
            id: p.id,
            user: p.user,
            aula: p.aula,
            day_of_week: selection.day,
            start_time: formatTime(selection.start),
            end_time: formatTime(selection.end),
            is_anytime: false,
          });
        }
      } else if (isSelecting && !draggingEvent && !hasMoved) {
        // Just clicked on empty space - maybe clear selection or keep it?
        // Let's keep the single cell selection for right-click creation.
      }
      setIsSelecting(false);
      setHasMoved(false);
      setDragStart(null);
      setDragButton(null);
      setDraggingEvent(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, selection, hasMoved, draggingEvent, permissions, upsertEvent]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readOnly || !dragStart || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + gridRef.current.scrollTop;
    
    // Day calculation - More robust relative to grid
    const colWidth = rect.width / 8;
    const scrollLeft = gridRef.current.scrollLeft || 0;
    const dayIndex = Math.floor((x + scrollLeft) / colWidth) - 1;
    const clampedDay = Math.max(0, Math.min(6, dayIndex));
    
    // Hour calculation - Each row is 25px (30 mins), hour is 50px
    const halfHours = Math.floor(y / 25);
    const timeVal = halfHours / 2;
    const clampedTime = Math.max(0, Math.min(23.5, timeVal));

    setHasMoved(true);
    setIsSelecting(true);

    if (draggingEvent) {
      if (draggingEvent.type === 'move') {
        const diff = clampedTime - dragStart.hour;
        const duration = draggingEvent.originalEnd - draggingEvent.originalStart;
        let newStart = draggingEvent.originalStart + diff;
        let newEnd = newStart + duration;
        if (newStart < 0) { newStart = 0; newEnd = duration; }
        if (newEnd > 24) { newEnd = 24; newStart = 24 - duration; }
        setSelection({ day: clampedDay, start: newStart, end: newEnd });
      } else {
        const start = draggingEvent.originalStart;
        const end = Math.max(start + 0.5, clampedTime + 0.5);
        setSelection({ day: draggingEvent.originalDay, start, end });
      }
    } else {
      const start = Math.min(dragStart.hour, clampedTime);
      const end = Math.max(dragStart.hour, clampedTime) + 0.5;
      setSelection({ day: dragStart.day, start, end });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, day: number, hour: number) => {
    if (readOnly) return;
    if (e.button === 0) {
      // Left Click (0) for selection
      setDragButton(0);
      setDragStart({ day, hour });
      setSelection({ day, start: hour, end: hour + 0.5 }); // Start with 30-min block
      setSelectedEventId(null);
    } else if (e.button === 2) {
      // Right Click (2) - Ensure we have at least a 1h selection if none exists
      // Check if click is near or within existing selection
      const isWithin = selection && selection.day === day && hour >= selection.start - 0.5 && hour <= selection.end;
      if (!isWithin) {
        setSelection({ day, start: hour, end: hour + 1 });
      }
    }
  };

  const startDraggingEvent = (e: React.MouseEvent, p: AccessPermission, type: 'move' | 'resize') => {
    // Left Click (0) for Select & potentially Drag
    if (readOnly && type !== 'move') return; // Allow select via move handler's click logic if needed, but let's be stricter
    if (e.button !== 0) return;
    
    e.stopPropagation();
    e.preventDefault();

    // Select the event regardless of move/resize
    setSelectedEventId(p.id);
    setSelection(null); // Clear range selection when selecting an event

    if (readOnly) return;

    const [startH, startM = 0] = (p.schedule_start || '00:00').split(':').map(Number);
    const [endH, endM = 0] = (p.schedule_end || '01:00').split(':').map(Number);
    const startVal = startH + (startM >= 30 ? 0.5 : 0);
    const endVal = endH + (endM >= 30 ? 0.5 : 0);
    
    setDragButton(0);
    setDraggingEvent({
      id: p.id,
      originalDay: p.schedule_day ?? 0,
      originalStart: startVal,
      originalEnd: endVal,
      type
    });
    setDragStart({ day: p.schedule_day ?? 0, hour: type === 'move' ? startVal : endVal - 0.5 });
    // Keep internal selection for move/resize logic
    setSelection({ day: p.schedule_day ?? 0, start: startVal, end: endVal });
    setHasMoved(false);
    setIsSelecting(true);
  };

  const handleSave = (data: any) => {
    upsertEvent({
      id: data.id,
      user: data.user,
      aula: data.aula,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      is_anytime: data.is_anytime,
    });
    setIsModalOpen(false);
    setSelection(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este horario?')) {
      deletePermission(id);
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  const stringToColor = (str: string) => {
    // Professional Teams-like palette (HSL: Hue, Saturation, Lightness)
    const palettes = [
      { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', accent: '#3B82F6' }, // Blue
      { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', accent: '#22C55E' }, // Green
      { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', accent: '#8B5CF6' }, // Purple
      { bg: '#FEFCE8', text: '#854D0E', border: '#FEF08A', accent: '#EAB308' }, // Yellow
      { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', accent: '#F43F5E' }, // Rose
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % palettes.length);
    return palettes[index];
  };

  // Unified grid calculation helpers
  const timeToMinutes = (timeStr: string | null | undefined) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventStyle = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start || !end) return {};
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    // 25px per 30 mins = 0.833 px per min
    const top = (startMins / 30) * ROW_HEIGHT;
    const height = ((endMins - startMins) / 30) * ROW_HEIGHT;
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const floatToTop = (val: number) => {
    // val is in hours (e.g., 7.5 for 07:30)
    return (val * 2) * ROW_HEIGHT;
  };

  const formatFloatTime = (val: number) => {
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Logic to handle overlapping events
  const getOverlappingGroups = (dayEvents: AccessPermission[]) => {
    const sorted = [...dayEvents].sort((a, b) => {
      const startA = timeToMinutes(a.schedule_start);
      const startB = timeToMinutes(b.schedule_start);
      return startA - startB;
    });

    const groups: AccessPermission[][] = [];
    sorted.forEach(event => {
      let placed = false;
      for (const group of groups) {
        // If this event overlaps with ANY event in the group, it belongs to this group's "cluster"
        const overlaps = group.some(e => {
          const s1 = timeToMinutes(e.schedule_start);
          const e1 = timeToMinutes(e.schedule_end);
          const s2 = timeToMinutes(event.schedule_start);
          const e2 = timeToMinutes(event.schedule_end);
          return Math.max(s1, s2) < Math.min(e1, e2);
        });
        
        if (overlaps) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([event]);
    });

    const results = new Map<string, { column: number; total: number }>();
    
    groups.forEach(group => {
      // For each group, we need to assign columns to each event
      // This is a simplified version: assign columns based on order in group
      // For more complex Teams-like stacked layout, we would check max concurrent overlaps at any point
      const columns: AccessPermission[][] = [];
      group.forEach(event => {
        let colIndex = 0;
        while (true) {
          if (!columns[colIndex]) columns[colIndex] = [];
          const colOverlaps = columns[colIndex].some(e => {
            const s1 = timeToMinutes(e.schedule_start);
            const e1 = timeToMinutes(e.schedule_end);
            const s2 = timeToMinutes(event.schedule_start);
            const e2 = timeToMinutes(event.schedule_end);
            return Math.max(s1, s2) < Math.min(e1, e2);
          });
          if (!colOverlaps) {
            columns[colIndex].push(event);
            break;
          }
          colIndex++;
        }
      });
      
      group.forEach(event => {
        const colIndex = columns.findIndex(col => col.includes(event));
        results.set(event.id, { column: colIndex, total: columns.length });
      });
    });
    
    return results;
  };

  const getEventPosition = (p: AccessPermission, overlapData?: { column: number; total: number }) => {
    const baseStyle = getEventStyle(p.schedule_start, p.schedule_end);
    if (!overlapData || overlapData.total <= 1) {
      return { ...baseStyle, left: '4px', right: '4px' };
    }
    const width = 100 / overlapData.total;
    const left = width * overlapData.column;
    return {
      ...baseStyle,
      left: `calc(${left}% + 2px)`,
      width: `calc(${width}% - 4px)`,
    };
  };

  // Get start of current week (Monday)
  const getWeekDates = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      return d;
    });
  };
  const weekDates = getWeekDates();

  const getNowPosition = () => {
    const day = now.getDay();
    const currentDayIndex = day === 0 ? 6 : day - 1;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalHalfHours = hours * 2 + (minutes >= 30 ? 1 : 0) + (minutes % 30) / 30;
    return { day: currentDayIndex, top: totalHalfHours * ROW_HEIGHT };
  };
  const nowPos = getNowPosition();

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner min-h-[500px]">
      {/* Week Navigator */}
      <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            Semanas de Acceso
          </h2>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Semana Anterior</span>
              &larr;
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 h-8 text-[11px] font-bold uppercase tracking-tight"
            >
              Hoy
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Semana Siguiente</span>
              &rarr;
            </Button>
          </div>
        </div>
        
        <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          {format(weekDates[0], 'd MMM')} - {format(weekDates[6], 'd MMM, yyyy', { locale: es })}
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="lg:hidden flex items-center justify-center gap-2 py-2 px-4 bg-indigo-50 border-b border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
        <RefreshCw className="h-3 w-3 animate-spin-slow rotate-90" />
        Desliza horizontalmente para ver la semana completa
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col">
        <div className="flex-1 min-w-[1100px] flex flex-col h-full">
          {/* Header */}
          <div 
            className="grid border-b border-slate-200 bg-white sticky top-0 z-10"
            style={{ 
              gridTemplateColumns: '80px repeat(7, 1fr)',
            }}
          >
        <div className="p-4 border-r border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center justify-center">
          GMT-5
        </div>
        {weekDates.map((date, i) => (
          <div key={i} className={cn(
            "p-3 text-center border-r last:border-r-0 border-slate-100 transition-colors",
            date.toDateString() === now.toDateString() ? "bg-blue-50/30" : "bg-white"
          )}>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-tighter mb-1",
              date.toDateString() === now.toDateString() ? "text-blue-600" : "text-slate-400"
            )}>
              {format(date, 'eee', { locale: es })}
            </p>
            <p className={cn(
              "text-xl font-bold rounded-full w-9 h-9 flex items-center justify-center mx-auto transition-all",
              date.toDateString() === now.toDateString() ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-900"
            )}>
              {format(date, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Grid body container */}
      <div 
        ref={gridRef}
        className="flex-1 overflow-y-auto relative grid bg-white/50" 
        style={{ 
          gridTemplateColumns: '80px repeat(7, 1fr)',
        }}
        onMouseMove={handleMouseMove}
        onContextMenu={(e) => {
          e.preventDefault();
          
          // Use the selection if it exists, otherwise use the selected event
          if (selection && !readOnly) {
            const formatTime = (v: number) => {
              const h = Math.min(Math.floor(v), 23);
              const m = v >= 24 ? '59' : ((v % 1) >= 0.5 ? '30' : '00');
              return `${String(h).padStart(2, '0')}:${m}:00`;
            };
            setEditingEvent({
              day_of_week: selection.day,
              start_time: formatTime(selection.start),
              end_time: formatTime(selection.end),
              is_anytime: false,
            });
            setIsModalOpen(true);
          } else if (selectedEventId) {
            const p = permissions.find(x => x.id === selectedEventId);
            if (p) {
              setEditingEvent({
                id: p.id,
                user: p.user,
                aula: p.aula,
                day_of_week: p.schedule_day,
                start_time: p.schedule_start,
                end_time: p.schedule_end,
                is_anytime: false,
              });
              setIsModalOpen(true);
            }
          }
        }}
      >
        {/* Hours labels column */}
        <div 
          className="grid grid-rows-[repeat(48,25px)] border-r border-slate-100 bg-slate-50/50 sticky left-0 z-20 h-[1200px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]"
        >
          {HOURS.map(h => (
            <div key={h} className="row-span-2 border-b border-slate-100/50 flex items-start justify-center pt-2">
              <span className="text-[10px] font-bold text-slate-400">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDates.map((date, dayIndex) => {
          return (
            <div key={dayIndex} className="relative border-r last:border-r-0 border-slate-100/50 grid grid-rows-[repeat(48,25px)] select-none h-[1200px]">
              {/* Now Indicator line */}
              {date.toDateString() === now.toDateString() && (
                <div 
                  className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                  style={{ top: nowPos.top }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                  <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                </div>
              )}
              
              {/* Background Grid Lines (30 mins slots) */}
              {Array.from({ length: 48 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "border-b border-slate-100/30 w-full h-full transition-colors cursor-pointer",
                    !readOnly && "hover:bg-blue-50/30",
                    i % 2 === 1 ? "border-b-slate-200/50" : "border-b-dashed border-b-slate-100"
                  )}
                  onMouseDown={(e) => handleMouseDown(e, dayIndex, i / 2)}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hasMoved) {
                      setSelection(null);
                      setSelectedEventId(null);
                    }
                  }}
                />
              ))}

              {/* Existing Events */}
              {(() => {
                const dayEvents = permissions.filter(p => {
                  const isRecurring = p.schedule_is_recurring !== false; // Default true
                  const day = p.schedule_day;
                  const dateStr = p.schedule_date;

                  if (p.schedule_is_anytime) return false;

                  if (isRecurring) {
                    return day === dayIndex;
                  } else if (dateStr) {
                    // Match specific date
                    return isSameDay(parse(dateStr, 'yyyy-MM-dd', new Date()), date);
                  }
                  return false;
                });
                const overlapDataMap = getOverlappingGroups(dayEvents);
                
                return dayEvents.map(p => {
                  const overlap = overlapDataMap.get(p.id);
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "absolute z-20 rounded-md p-1.5 shadow-sm cursor-pointer group hover:shadow-md transition-all border overflow-hidden select-none",
                        isSelecting && "pointer-events-none opacity-60",
                        draggingEvent?.id === p.id && "opacity-40 grayscale scale-95 z-0",
                        selectedEventId === p.id ? "ring-2 ring-blue-500 ring-offset-1 z-[15] shadow-lg scale-[1.02]" : "hover:scale-[1.01]"
                      )}
                      style={{
                        ...getEventPosition(p, overlap),
                        backgroundColor: stringToColor(p.user_email || p.user || 'anon').bg,
                        borderColor: stringToColor(p.user_email || p.user || 'anon').border,
                        color: stringToColor(p.user_email || p.user || 'anon').text,
                        minHeight: '24px',
                      }}
                      onMouseDown={(e) => startDraggingEvent(e, p, 'move')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingEvent({
                          id: p.id,
                          user: p.user,
                          aula: p.aula,
                          day_of_week: p.schedule_day,
                          start_time: p.schedule_start,
                          end_time: p.schedule_end,
                          is_anytime: false,
                        });
                        setIsModalOpen(true);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingEvent({
                          id: p.id,
                          user: p.user,
                          aula: p.aula,
                          day_of_week: p.schedule_day,
                          start_time: p.schedule_start,
                          end_time: p.schedule_end,
                          is_anytime: false,
                        });
                        setIsModalOpen(true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasMoved) return; 
                        if (e.button === 0) {
                          setSelectedEventId(p.id);
                          setSelection(null);
                        }
                      }}
                    >
                      <div className={cn(
                        "flex flex-col h-full overflow-hidden pl-1",
                        (overlap && overlap.total > 1) ? "text-[8px]" : "text-[10px]" 
                      )}>
                        <div className="flex items-center gap-1 mb-0.5 flex-wrap overflow-hidden leading-none">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stringToColor(p.user_email || p.user || 'anon').accent }} />
                          <p className="font-black uppercase tracking-tighter opacity-70 truncate text-[7px] lg:text-[9px]">{p.aula_code}</p>
                        </div>
                        <p className="font-bold leading-tight truncate mb-0.5 text-[9px] lg:text-[11px]">{p.user_nombre}</p>
                        <div className="mt-auto flex items-center justify-between gap-1 opacity-70">
                          <div className="flex items-center gap-0.5 overflow-hidden min-w-0">
                            <Clock className="h-2 w-2 shrink-0" />
                            <span className="font-medium whitespace-nowrap text-[7px] lg:text-[9px] truncate">
                              {p.schedule_start?.slice(0,5)} - {p.schedule_end?.slice(0,5)}
                            </span>
                          </div>
                          {selectedEventId === p.id && (
                            <div className="bg-white rounded p-1 shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors">
                              <Pencil className="h-2.5 w-2.5 text-blue-600" />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Resize handle (bottom) */}
                      {!readOnly && (
                        <div 
                          className="absolute bottom-0 inset-x-0 h-2 cursor-ns-resize hover:bg-white/30 transition-colors z-30" 
                          onMouseDown={(e) => startDraggingEvent(e, p, 'resize')}
                        />
                      )}
                    </div>
                  );
                });
              })()}

              {/* Current Selection Ghost */}
              {selection && selection.day === dayIndex && (
                <div 
                  className={cn(
                    "absolute inset-x-1 border-2 rounded-md z-20 pointer-events-none flex items-center justify-center overflow-hidden transition-all duration-75",
                    isSelecting ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(37,99,235,0.2)]" : "border-slate-400 bg-slate-400/10"
                  )}
                  style={{
                    top: `${floatToTop(selection.start)}px`,
                    height: `${floatToTop(selection.end - selection.start)}px`,
                  }}
                >
                  <div className="text-[9px] font-black text-blue-700 uppercase tracking-tight bg-white/90 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm border border-blue-100 whitespace-nowrap">
                    {formatFloatTime(selection.start)} - {formatFloatTime(selection.end)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div> {/* grid body container */}
    </div> {/* min-w flex flex-col */}
  </div> {/* horizontal scroll container */}

  <CalendarEventModal 
    isOpen={isModalOpen}
    onClose={() => {
      setIsModalOpen(false);
      setSelection(null);
    }}
    initialData={editingEvent}
    onSave={handleSave}
    onDelete={handleDelete}
    readOnly={readOnly}
  />
</div>
  );
}
