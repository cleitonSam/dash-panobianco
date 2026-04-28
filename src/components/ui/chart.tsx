"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Workaround for https://github.com/recharts/recharts/issues/3609
function set  ChartStyle(node: HTMLElement, cssVars: Record<string, string>) {
  node.style.cssText += Object.entries(cssVars)
    .map(([key, value]) => `--${key}: ${value}`)
    .join(";");
}

interface ChartConfig {
  [k: string]: {
    label?: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
  };
}

type ChartContextProps = {
  config: ChartConfig;
  children: React.ReactNode;
} & (
  | {
      /**
       * @deprecated Use `activeIdx` instead.
       */
      activeLabel?: string;
      activeIdx: number;
      payload?: RechartsPrimitive.TooltipProps<any, any>["payload"];
      internalCursor?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      };
    }
  | {
      /**
       * @deprecated Use `activeIdx` instead.
       */
      activeLabel?: never;
      activeIdx?: never;
      payload?: never;
      internalCursor?: never;
    }
);

const ChartContext = React.createContext<ChartContextProps | null>(null);

function ChartProvider({ config, children }: ChartContextProps) {
  const [activeIdx, setActiveIdx] = React.useState<number>();
  const [activeLabel, setActiveLabel] = React.useState<string>();
  const [payload, setPayload] =
    React.useState<RechartsPrimitive.TooltipProps<any, any>["payload"]>();
  const [internalCursor, setInternalCursor] = React.useState<
    | {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | undefined
  >();

  const handleMouseLeave = React.useCallback(() => {
    setActiveIdx(undefined);
    setActiveLabel(undefined);
    setPayload(undefined);
    setInternalCursor(undefined);
  }, []);

  const handleMouseEnter = React.useCallback(
    (state: RechartsPrimitive.ActiveShape<any>) => {
      if (state) {
        const { activeTooltipIndex, activeLabel, activePayload, activeCursor } =
          state;

        setActiveIdx(activeTooltipIndex);
        setActiveLabel(activeLabel);
        setPayload(activePayload);
        setInternalCursor(activeCursor);
      }
    },
    []
  );

  return (
    <ChartContext.Provider
      value={{
        config,
        activeIdx,
        activeLabel,
        payload,
        internalCursor,
        children,
      }}
    >
      <div
        data-chart={true}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartProvider />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  {
    config: ChartConfig;
    children: React.ReactNode;
    className?: string;
  }
>(({ config, className, children, ...props }, ref) => {
  const id = React.useId();
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setChartStyle(
      container,
      Object.entries(config).map(([key, { color }]) => ({
        [key]: color,
      })) as Record<string, string>
    );
  }, [config]);

  return (
    <ChartProvider config={config}>
      <div
        ref={ref}
        className={cn(
          "flex h-[--chart-height] w-full flex-col items-center justify-center",
          className
        )}
        {...props}
      >
        <div ref={containerRef} className="flex w-full flex-col">
          <RechartsPrimitive.ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={300}
          >
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </div>
    </ChartProvider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.TooltipProps<any, any> & {
    className?: string;
    hideIndicator?: boolean;
    formatter?: (
      value: any,
      name: string,
      props: RechartsPrimitive.TooltipPayload<any, any>
    ) => React.ReactNode;
  }
>(({ className, formatter, hideIndicator = false, ...props }, ref) => {
  const { activeLabel, payload, config } = useChart();

  if (!activeLabel || !payload || !payload.length) {
    return null;
  }

  const formattedPayload = payload.map((item) => {
    const { name, value, fill } = item;
    const color = config[name as string]?.color || fill;
    return {
      ...item,
      color,
      formattedValue: formatter ? formatter(value, name as string, item) : value,
    };
  });

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] p-2 text-sm shadow-md",
        className
      )}
      {...props}
    >
      <p className="font-medium text-[hsl(var(--foreground))]">{activeLabel}</p>
      {formattedPayload.map((item, index) => (
        <div
          key={item.dataKey || index}
          className="flex items-center justify-between gap-x-4 py-1"
        >
          <div className="flex items-center gap-x-2">
            {!hideIndicator && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            {config[item.dataKey as string]?.icon && (
              <config.icon
                className="h-4 w-4"
                style={{ color: item.color }}
              />
            )}
            <span className="text-[hsl(var(--muted-foreground))]">
              {config[item.dataKey as string]?.label || item.dataKey}
            </span>
          </div>
          <span className="font-bold text-[hsl(var(--foreground))]">
            {item.formattedValue}
          </span>
        </div>
      ))}
    </div>
  );
});
ChartTooltip.displayName = "ChartTooltip";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.LegendProps & {
    className?: string;
    hideIcon?: boolean;
  }
>(({ className, hideIcon = false, ...props }, ref) => {
  const { payload, config } = useChart();

  if (!payload || !payload.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2",
        className
      )}
      {...props}
    >
      {payload.map((item) => {
        const { value, payload, fill } = item;
        const name = payload?.name || value;
        const color = config[name as string]?.color || fill;

        if (!name) return null;

        return (
          <div
            key={name}
            className="flex items-center gap-x-2"
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            {config[name as string]?.icon && (
              <config.icon
                className="h-4 w-4"
                style={{ color: color }}
              />
            )}
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {config[name as string]?.label || name}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegend.displayName = "ChartLegend";

export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartProvider,
  useChart,
};