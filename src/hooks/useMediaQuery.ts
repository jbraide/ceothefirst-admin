import { useState, useEffect } from "react";

/**
 * Reactive media-query hook.
 * Returns `true` while the given CSS media query matches,
 * and re-renders whenever the match status changes.
 *
 * @param query  A valid CSS media query string, e.g. "(min-width: 768px)"
 * @returns      Whether the query currently matches
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 */
export function useMediaQuery(query: string): boolean {
  // SSR-safe: default to `false` when `window` is unavailable.
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(query);

    // Reflect the initial value (in case it changed between construction and effect).
    setMatches(mql.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers support the event-based API.
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
    } else {
      // Fallback for older browsers.
      mql.addListener(handler);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}
