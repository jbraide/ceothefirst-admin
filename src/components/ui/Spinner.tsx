import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SpinnerProps {
  /** Additional class names */
  className?: string;
  /** Spinner size in pixels (applied to width & height) */
  size?: number;
}

export function Spinner({ className, size = 24 }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      size={size}
      aria-label="Loading"
      role="status"
    />
  );
}
