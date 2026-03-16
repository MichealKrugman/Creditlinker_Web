import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

const variantClasses: Record<BadgeVariant, string> = {
  default:     "bg-[#0A2540] text-white border-transparent",
  secondary:   "bg-[#F0FDFF] text-[#0A5060] border-[rgba(0,212,255,0.22)]",
  outline:     "bg-transparent text-[#0A2540] border-[#D1D5DB]",
  success:     "bg-[#ECFDF5] text-[#10B981] border-[rgba(16,185,129,0.2)]",
  warning:     "bg-[#FFFBEB] text-[#F59E0B] border-[rgba(245,158,11,0.2)]",
  destructive: "bg-[#FEF2F2] text-[#EF4444] border-[rgba(239,68,68,0.2)]",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
