"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Context ────────────────────────────────────────────── */
type AccordionType = "single" | "multiple"

interface AccordionContextValue {
  type: AccordionType
  openItems: string[]
  toggle: (value: string) => void
  collapsible: boolean
}

const AccordionContext = React.createContext<AccordionContextValue>({
  type: "single",
  openItems: [],
  toggle: () => {},
  collapsible: false,
})

/* ─── Root ───────────────────────────────────────────────── */
interface AccordionSingleProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "single"
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  collapsible?: boolean
}

interface AccordionMultipleProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "multiple"
  defaultValue?: string[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  collapsible?: boolean
}

type AccordionRootProps = AccordionSingleProps | AccordionMultipleProps

function Accordion({ type = "single", collapsible = false, defaultValue, className, children, ...props }: AccordionRootProps) {
  const initialOpen = defaultValue
    ? Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    : []
  const [openItems, setOpenItems] = React.useState<string[]>(initialOpen)

  const toggle = React.useCallback((value: string) => {
    setOpenItems((prev) => {
      if (type === "single") {
        if (prev.includes(value)) return collapsible ? [] : prev
        return [value]
      }
      return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    })
  }, [type, collapsible])

  return (
    <AccordionContext.Provider value={{ type, openItems, toggle, collapsible }}>
      <div data-slot="accordion" className={cn("", className)} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

/* ─── Item Context ───────────────────────────────────────── */
const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean }>({ value: "", isOpen: false })

/* ─── Item ───────────────────────────────────────────────── */
interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
}

function AccordionItem({ value, disabled, className, children, ...props }: AccordionItemProps) {
  const { openItems } = React.useContext(AccordionContext)
  const isOpen = openItems.includes(value)

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        data-slot="accordion-item"
        data-state={isOpen ? "open" : "closed"}
        data-disabled={disabled ? "" : undefined}
        className={cn("border-b last:border-b-0", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

/* ─── Trigger ────────────────────────────────────────────── */
interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  const { toggle } = React.useContext(AccordionContext)
  const { value, isOpen } = React.useContext(AccordionItemContext)

  return (
    <div className="flex">
      <button
        type="button"
        data-slot="accordion-trigger"
        data-state={isOpen ? "open" : "closed"}
        aria-expanded={isOpen}
        onClick={() => toggle(value)}
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
    </div>
  )
}

/* ─── Content ────────────────────────────────────────────── */
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  const { isOpen } = React.useContext(AccordionItemContext)

  if (!isOpen) return null

  return (
    <div
      data-slot="accordion-content"
      data-state="open"
      className="overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
