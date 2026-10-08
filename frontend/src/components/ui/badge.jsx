import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-700 border-blue-200",
        secondary: "bg-slate-100 text-slate-700 border-slate-200",
        destructive: "bg-red-50 text-red-700 border-red-200",
        outline: "text-slate-700 border-slate-300 bg-white",
        critical: "bg-red-100 text-red-800 border-red-300 font-bold",
        high: "bg-orange-100 text-orange-800 border-orange-300 font-bold",
        medium: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
        low: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
