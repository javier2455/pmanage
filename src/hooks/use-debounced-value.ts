"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `value` con retardo: solo se actualiza cuando pasan `delay` ms sin
 * que cambie. Para búsquedas que disparan una petición, y así no lanzar una por
 * cada tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
