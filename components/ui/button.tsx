import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "accent" | "ghost-dark";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:    "bg-[#0A2540] text-white hover:bg-[#0d3060] shadow-sm hover:shadow-[0_8px_24px_rgba(10,37,64,0.18)]",
  outline:    "bg-transparent text-[#0A2540] border border-[#D1D5DB] hover:border-[#0A2540] hover:bg-[#F9FAFB]",
  ghost:      "bg-transparent text-[#6B7280] hover:text-[#0A2540] hover:bg-[#F3F4F6]",
  accent:     "bg-[#00D4FF] text-[#0A2540] font-bold hover:opacity-90 shadow-sm hover:shadow-[0_8px_24px_rgba(0,212,255,0.22)]",
  "ghost-dark": "bg-transparent text-white/70 border border-white/15 hover:border-white/35 hover:bg-white/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8  px-4  text-xs  rounded-md",
  md: "h-10 px-5  text-sm  rounded-lg",
  lg: "h-12 px-7  text-[15px] rounded-lg",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
