"use client"

import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
      case "destructive":
        return <XCircle className="h-5 w-5 text-red-500 shrink-0" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
      default:
        return <Info className="h-5 w-5 text-primary shrink-0" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div className="flex items-start gap-3 flex-1">
              {getIcon(variant as string)}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
