import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isEqual, startOfDay } from 'date-fns'; // Importar startOfDay
import { ptBR } from 'date-fns/locale';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface Preset {
  label: string;
  range: DateRange;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
  presets: Preset[];
  className?: string;
  disabled?: boolean; // Adicionado prop disabled
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateChange,
  presets,
  className,
  disabled = false, // Default para false
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isPresetActive = (presetRange: DateRange) => {
    if (!dateRange.from || !presetRange.from || !dateRange.to || !presetRange.to) {
      return false;
    }
    // Comparar apenas o início do dia para consistência
    return isEqual(startOfDay(dateRange.from), startOfDay(presetRange.from)) && 
           isEqual(startOfDay(dateRange.to), startOfDay(presetRange.to));
  };

  const activePreset = useMemo(() => {
    return presets.find(p => isPresetActive(p.range));
  }, [dateRange, presets]);

  const displayDateRange = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return "Selecione um período";
    if (dateRange.from && !dateRange.to) return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
    if (!dateRange.from && dateRange.to) return format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR });
    if (dateRange.from && dateRange.to && isEqual(startOfDay(dateRange.from), startOfDay(dateRange.to))) {
      return format(dateRange.from!, 'dd/MM/yyyy', { locale: ptBR });
    }
    return `${format(dateRange.from!, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to!, 'dd/MM/yyyy', { locale: ptBR })}`;
  }, [dateRange]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant={isPresetActive(preset.range) ? 'default' : 'outline'}
          onClick={() => {
            onDateChange(preset.range);
            setIsCalendarOpen(false); // Fecha o calendário ao selecionar um preset
          }}
          disabled={disabled}
          className={cn(
            isPresetActive(preset.range) ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90" : "bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          )}
        >
          {preset.label}
        </Button>
      ))}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={!activePreset ? 'default' : 'outline'}
            className={cn(
              "w-[280px] justify-start text-left font-normal bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md text-[hsl(var(--foreground))]",
              !dateRange.from && "text-[hsl(var(--muted-foreground))]",
              "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]",
              !activePreset ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90" : "bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {!activePreset ? displayDateRange : 'Período Personalizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 !animate-in !animate-out bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]" // Removendo animação de entrada
          side="bottom" 
          align="center"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateChange(range || {});
              // Fecha o popover apenas se ambas as datas (início e fim) foram selecionadas
              if (range?.from && range?.to) {
                setIsCalendarOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
            className="text-[hsl(var(--foreground))]"
            classNames={{
              day_selected: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]",
              day_range_middle: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary-foreground))]",
              caption_label: "text-[hsl(var(--foreground))]",
              nav_button: "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
              head_row: "text-[hsl(var(--muted-foreground))]",
              day: "text-[hsl(var(--foreground))]",
              day_outside: "text-[hsl(var(--muted-foreground))]",
              day_hidden: "text-[hsl(var(--muted-foreground))]",
              month: "text-[hsl(var(--foreground))]",
              months: "bg-[hsl(var(--card-bg))]",
              nav: "text-[hsl(var(--foreground))]",
              weeknumber: "text-[hsl(var(--foreground))]",
              cell: "text-[hsl(var(--foreground))]",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};