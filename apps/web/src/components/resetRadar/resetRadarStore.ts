import { create } from "zustand";
import { persist } from "zustand/middleware";

// Device-local and off by default. The Radar desktop profile has its own storage.
export const useResetRadarSettings = create<{
  enabled: boolean;
  endpoint: string;
  configure: (enabled: boolean, endpoint: string) => void;
}>()(
  persist(
    (set) => ({
      enabled: false,
      endpoint: "http://127.0.0.1:3100",
      configure: (enabled, endpoint) => set({ enabled, endpoint }),
    }),
    {
      name: "t3code-radar:read-only-settings:v1",
      partialize: ({ enabled, endpoint }) => ({ enabled, endpoint }),
    },
  ),
);
