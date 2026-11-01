import * as React from "react";
import { cn } from "@/lib/utils";

const field = "flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, className)} {...p} />
));
Input.displayName = "Input";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(field, "appearance-auto", className)} {...p} />
));
Select.displayName = "Select";
export const Label = (p: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label {...p} className={cn("text-sm font-medium", p.className)} />
);
