import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon =
          variant === 'destructive'
            ? AlertCircle
            : variant === 'success'
            ? CheckCircle2
            : Info

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              <Icon
                className={`h-5 w-5 shrink-0 mt-0.5 ${
                  variant === 'destructive'
                    ? 'text-red-400'
                    : variant === 'success'
                    ? 'text-emerald-400'
                    : 'text-primary'
                }`}
              />
              <div className="grid gap-1 flex-1 pr-2">
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
