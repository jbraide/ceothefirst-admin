import { useEffect, useRef, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    }

    document.addEventListener("click", handleClick as EventListener);
    document.addEventListener("touchend", handleClick as EventListener);
    return () => {
      document.removeEventListener("click", handleClick as EventListener);
      document.removeEventListener("touchend", handleClick as EventListener);
    };
  }, [handler]);

  return ref;
}
