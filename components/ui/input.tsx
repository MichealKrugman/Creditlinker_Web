import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0A2540] shadow-none transition-colors outline-none placeholder:text-[#9CA3AF]",
        "focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.15)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
