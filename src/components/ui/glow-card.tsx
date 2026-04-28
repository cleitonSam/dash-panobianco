import React from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlowCard({ children, className, ...props }: GlowCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card text-card-foreground shadow-xl transition-all duration-300 hover:border-primary/50",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-800/50 via-transparent to-gray-800/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}