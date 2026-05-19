import { useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/utils/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  /** The message to display */
  message: string;
  /** Visual style of the toast */
  type?: ToastType;
  /** Called when the toast is dismissed (close click or auto-dismiss) */
  onClose: () => void;
  /** Duration in ms before auto-dismissing (default: 5000) */
  duration?: number;
}

const iconMap: Record<
  ToastType,
  React.ComponentType<{ className?: string }>
> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const variantStyles: Record<ToastType, string> = {
  success: "border-emerald-500 bg-emerald-50 text-emerald-900",
  error: "border-destructive bg-red-50 text-red-900",
  info: "border-primary-400 bg-primary-50 text-primary-900",
  warning: "border-amber-500 bg-amber-50 text-amber-900",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-destructive",
  info: "text-primary-500",
  warning: "text-amber-500",
};

export function Toast({
  message,
  type = "info",
  onClose,
  duration = 5000,
}: ToastProps) {
  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [handleDismiss, duration]);

  const Icon = iconMap[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "pointer-events-auto fixed bottom-4 right-4 z-50 flex w-full max-w-sm items-center gap-3 rounded-lg border-l-4 bg-white p-4 shadow-lg",
        variantStyles[type],
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", iconStyles[type])} />

      <p className="flex-1 text-sm font-medium">{message}</p>

      <button
        type="button"
        onClick={handleDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
