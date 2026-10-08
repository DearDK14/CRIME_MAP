import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium font-mono ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-700 text-white hover:bg-blue-800 shadow-sm active:scale-[0.98]",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]",
        outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.98]",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        link: "text-blue-700 underline-offset-4 hover:underline p-0 h-auto",
        police: "bg-[#0f2b48] hover:bg-[#1b365d] text-white border border-[#0f2b48] shadow-sm active:scale-[0.98]",
        glow: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-[11px]",
        lg: "h-11 rounded-lg px-8 text-sm",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";
export { buttonVariants };
