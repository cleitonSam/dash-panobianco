import React from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPercentage?: boolean;
  };
  className?: string;
  valueClassName?: string;
  hasLeftBorderGradient?: boolean; // Nova prop
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>( // Adicionado React.forwardRef
  ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend, 
    className,
    valueClassName,
    hasLeftBorderGradient = false, // Default para false
    ...props // Captura outras props, incluindo ref
  }, ref) => { // Adicionado ref
    const getTrendIcon = () => {
      if (!trend) return null;
      if (trend.value > 0) return <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-400" />;
      if (trend.value < 0) return <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-400" />;
      return <Minus className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />;
    };

    const getTrendColor = () => {
      if (!trend) return "";
      if (trend.value > 0) return "text-green-400";
      if (trend.value < 0) return "text-red-400";
      return "text-gray-400";
    };

    return (
      <Card 
        ref={ref} // Repassando a ref para o Card
        className={cn(
          "glow-card", // Usando a classe glow-card definida em globals.css
          "min-h-[120px] md:min-h-[140px]",
          hasLeftBorderGradient && "metric-card-left-border pl-4", // Adiciona a classe para o gradiente e padding
          className
        )}
        {...props} // Passa as demais props para o Card
      >
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2 md:mb-3">
            <CardTitle className="text-xs md:text-sm font-semibold text-[hsl(var(--muted-foreground))] tracking-wide uppercase leading-tight">
              {title}
            </CardTitle>
            {icon && (
              <div className={cn(
                "p-1.5 md:p-2 rounded-lg bg-[hsl(var(--background))]/60",
              )}>
                {icon}
              </div>
            )}
          </div>
          
          <div className={cn(
            "text-xl md:text-2xl lg:text-3xl font-bold text-[hsl(var(--foreground))] mb-1 md:mb-2 font-sans leading-none",
            valueClassName
          )}>
            {value}
          </div>
          
          {subtitle && (
            <p className="text-[10px] md:text-xs text-[hsl(var(--muted-foreground))]/80 leading-tight md:leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center text-[10px] md:text-xs font-medium mt-2 md:mt-3 pt-2 border-t border-[hsl(var(--border))]/40",
              getTrendColor()
            )}>
              {getTrendIcon()}
              <span className="ml-1.5 md:ml-2">
                {trend.value > 0 ? "+" : ""}{trend.value}{trend.isPercentage ? '%' : ''} {trend.label}
              </span>
            </div>
          )}
        </div>

        {/* Corner accents - removidos para simplificar e usar o glow-card */}
      </Card>
    );
  }
);

MetricCard.displayName = "MetricCard"; // Adicionado displayName para melhor depuração