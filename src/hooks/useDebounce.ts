import { useState, useEffect } from "react";

/**
 * Generic debounce hook.
 * Delays updating the returned value until `delay` ms have elapsed
 * since the last change to `value`.
 *
 * @param value  The value to debounce
 * @param delay  Debounce delay in milliseconds (default 300)
 * @returns      The debounced value
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 400);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Start a timer that updates the debounced value after `delay` ms.
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if `value` or `delay` changes before the timeout fires.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
