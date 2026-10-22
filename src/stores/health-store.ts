import { defaultPermissions, seedEntries, validateOptions, type Permissions, type ManualEntry } from "../features/health/entries.js";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Provider, Range } from "../features/health/model";
export interface Connection {
  connected: boolean;
  status: "connected" | "disconnected" | "connecting" | "syncing" | "error";
  syncedAt: string | null;
  error: string | null;
}
const initialConnections = (): Record<Provider, Connection> =>
  Object.fromEntries(
    ["apple", "garmin", "strava"].map((id) => [
      id,
      {
        connected: true,
        status: "connected",
        syncedAt: "2026-10-18T23:59:00+07:00",
        error: null,
      },
    ]),
  ) as Record<Provider, Connection>;
const operations: Record<Provider, number> = { apple: 0, garmin: 0, strava: 0 };
interface HealthState {
  permissions: Permissions;
  entries: ManualEntry[];
  setPermissions: (provider: Provider, permissions: Permissions[Provider]) => void;
  saveEntry: (entry: ManualEntry) => void;
  deleteEntry: (id: string) => void;
  range: Range;
  connections: Record<Provider, Connection>;
  revision: number;
  setRange: (range: Range) => void;
  connect: (provider: Provider, fail?: boolean) => Promise<void>;
  disconnect: (provider: Provider) => void;
  reset: () => void;
}
export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      permissions: defaultPermissions(),
      entries: seedEntries(),
      setPermissions: (provider, selected) => set(s => ({ permissions: validateOptions({ permissions: { ...s.permissions, [provider]: selected } }).permissions!, revision: s.revision + 1 })),
      saveEntry: (entry) => set(s => ({ entries: validateOptions({ entries: [...s.entries.filter(e => e.id !== entry.id), entry] }).entries!, revision: s.revision + 1 })),
      deleteEntry: (id) => set(s => ({ entries: s.entries.filter(e => e.id !== id), revision: s.revision + 1 })),
      range: "7d",
      connections: initialConnections(),
      revision: 0,
      setRange: (range) => set({ range }),
      connect: async (provider, fail = false) => {
        const operation = ++operations[provider];
        const patch = (value: Partial<Connection>) =>
          set((s) => ({
            connections: {
              ...s.connections,
              [provider]: { ...s.connections[provider], ...value },
            },
          }));
        patch({
          status: get().connections[provider].connected
            ? "syncing"
            : "connecting",
          error: null,
        });
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (operations[provider] !== operation) return;
        patch({ status: "syncing" });
        await new Promise((resolve) => setTimeout(resolve, 450));
        if (operations[provider] !== operation) return;
        if (fail) {
          patch({
            status: "error",
            error: "Simulated sync failed. Retry to sync this source.",
          });
          return;
        }
        set((s) => ({
          connections: {
            ...s.connections,
            [provider]: {
              connected: true,
              status: "connected",
              syncedAt: new Date().toISOString(),
              error: null,
            },
          },
          revision: s.revision + 1,
        }));
      },
      disconnect: (provider) => {
        operations[provider]++;
        set((s) => ({
          connections: {
            ...s.connections,
            [provider]: {
              connected: false,
              status: "disconnected",
              syncedAt: null,
              error: null,
            },
          },
          revision: s.revision + 1,
        }));
      },
      reset: () => {
        for (const id of ["apple", "garmin", "strava"] as const)
          operations[id]++;
        set((s) => ({
          permissions: defaultPermissions(),
          entries: seedEntries(),
          range: "7d",
          connections: initialConnections(),
          revision: s.revision + 1,
        }));
      },
    }),
    {
      name: "health-insight-demo-v1",
      version: 1,
      partialize: (s) => ({
        permissions: s.permissions,
        entries: s.entries,
        range: s.range,
        connections: Object.fromEntries(
          Object.entries(s.connections).map(([id, c]) => [
            id,
            {
              ...c,
              status: c.connected ? "connected" : "disconnected",
              error: null,
            },
          ]),
        ),
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<HealthState> | undefined;
        const connections = initialConnections();
        for (const id of ["apple", "garmin", "strava"] as const) {
          const value = saved?.connections?.[id];
          if (value && typeof value.connected === "boolean")
            connections[id] = {
              connected: value.connected,
              status: value.connected ? "connected" : "disconnected",
              syncedAt:
                typeof value.syncedAt === "string" ? value.syncedAt : null,
              error: null,
            };
        }
        let options = { permissions: defaultPermissions(), entries: seedEntries() };
        try {
          const validated = validateOptions({ permissions: saved?.permissions, entries: saved?.entries ?? seedEntries() });
          options = { permissions: validated.permissions!, entries: validated.entries! };
        } catch { /* Invalid local data resets to deterministic demo entries. */ }
        return {
          ...current,
          ...options,
          range: saved?.range === "60d" ? "60d" : saved?.range === "30d" ? "30d" : "7d",
          connections,
        };
      },
    },
  ),
);
