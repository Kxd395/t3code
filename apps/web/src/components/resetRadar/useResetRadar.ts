import { useEffect, useRef, useState } from "react";
import type { ResetRadarStatus } from "@t3tools/contracts";
import { decodeRadarStatus, validateRadarEndpoint } from "./resetRadar.logic";
import { useResetRadarSettings } from "./resetRadarStore";

export function useResetRadar() {
  const enabled = useResetRadarSettings((state) => state.enabled);
  const endpoint = useResetRadarSettings((state) => state.endpoint);
  const refreshRef = useRef<(() => void) | null>(null);
  const [result, setResult] = useState<{
    status: ResetRadarStatus | null;
    error: string | null;
    observedAt: number;
  }>({
    status: null,
    error: null,
    observedAt: 0,
  });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let inFlight = false;
    let controller: AbortController | null = null;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 5_000);
      try {
        const base = validateRadarEndpoint(endpoint);
        const response = await fetch(`${base}/v1/status`, {
          signal: controller.signal,
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
        });
        if (!response.ok) throw new Error(`Reset Radar service returned HTTP ${response.status}.`);
        const text = await response.text();
        if (text.length > 512_000) throw new Error("Reset Radar response exceeded its size limit.");
        const status = decodeRadarStatus(JSON.parse(text));
        if (active) setResult({ status, error: null, observedAt: Date.now() });
      } catch (error) {
        if (active)
          setResult((previous) => ({
            ...previous,
            observedAt: Date.now(),
            error:
              error instanceof Error && error.name !== "AbortError"
                ? error.message
                : "Reset Radar is disconnected or timed out.",
          }));
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
      }
    };
    refreshRef.current = () => void refresh();
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      refreshRef.current = null;
      active = false;
      controller?.abort();
      window.clearInterval(timer);
    };
  }, [enabled, endpoint]);
  return { enabled, ...result, refresh: () => refreshRef.current?.() };
}
