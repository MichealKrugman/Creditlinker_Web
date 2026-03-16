import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0A2540] shadow-none transition-colors outline-none resize-none placeholder:text-[#9CA3AF]",
        "focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.15)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
