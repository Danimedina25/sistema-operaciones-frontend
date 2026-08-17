import { useCallback, useEffect, useRef, useState } from 'react';

interface UseClipboardOptions {
  resetDelayMs?: number;
}

/**
 * Copia texto al portapapeles y expone un flag `copied` temporal para
 * mostrar confirmación visual.
 */
export function useClipboard({ resetDelayMs = 2000 }: UseClipboardOptions = {}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetDelayMs);

        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetDelayMs],
  );

  return { copy, copied };
}
