import { useState, useCallback } from "react";

/**
 * Reads a value from localStorage. Returns `fallback` when running
 * server-side (SSR-safe) or when the key does not exist.
 */
function readValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted data or parse error — fall back gracefully.
    return fallback;
  }
}

/**
 * Persist a piece of state to localStorage with SSR safety.
 *
 * @param key       localStorage key
 * @param fallback  Default value when nothing is stored yet
 * @returns         [storedValue, setValue, removeValue]
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readValue(key, fallback),
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          value instanceof Function ? (value as (prev: T) => T)(prev) : value;

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // quota exceeded or private-browsing restriction — ignore.
          }
        }

        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    setStoredValue(fallback);
  }, [key, fallback]);

  return [storedValue, setValue, removeValue];
}
