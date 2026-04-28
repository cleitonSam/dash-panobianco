"use client";

import React from 'react';
import { SelectContent, SelectContentProps } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const NoAnimationSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  SelectContentProps
>(({ className, children, ...props }, ref) => (
  <SelectContent
    ref={ref}
    className={cn(
      "data-[state=open]:animate-none data-[state=closed]:animate-none", // Desabilita as animações de entrada/saída
      className
    )}
    {...props}
  >
    {children}
  </SelectContent>
));
NoAnimationSelectContent.displayName = SelectContent.displayName;

export { NoAnimationSelectContent };