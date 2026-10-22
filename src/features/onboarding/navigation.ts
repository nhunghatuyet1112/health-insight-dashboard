import { useSyncExternalStore } from "react";
const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
export function useRoute() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.replace(/^#/, "") || "/",
    () => "/",
  );
}
export function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "instant" });
}
