import { useState, useCallback } from "react";

export interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "info") => {
      setToast({ message, type });
    },
    [],
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
