import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

function FormField({ label, required, error, children, className, htmlFor }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-hrm-red">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-hrm-red animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormErrorBannerProps {
  message: string
  className?: string
}

function FormErrorBanner({ message, className }: FormErrorBannerProps) {
  if (!message) return null
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border border-hrm-red/20 bg-hrm-red-light p-3 animate-in fade-in-0 slide-in-from-top-1 duration-200",
      className
    )}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-hrm-red">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <p className="text-sm text-hrm-red">{message}</p>
    </div>
  )
}

export { FormField, FormErrorBanner }
