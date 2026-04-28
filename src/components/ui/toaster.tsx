"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[hsl(var(--card-bg))] group-[.toaster]:text-[hsl(var(--text-color))] group-[.toaster]:border-[hsl(var(--border-color))] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[hsl(var(--muted-foreground))]",
          actionButton: "group-[.toast]:bg-[hsl(var(--primary))] group-[.toast]:text-[hsl(var(--primary-foreground))]",
          cancelButton: "group-[.toast]:bg-[hsl(var(--secondary-black))] group-[.toast]:text-[hsl(var(--accent-white))]",
        },
      }}
    />
  );
}