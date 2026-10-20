import {
  Bell,
  CalendarDays,
  ChevronDown,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 glass-header px-6 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="md:hidden flex items-center gap-2 pr-3 border-r border-white/10">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-primary/40 flex items-center justify-center text-primary">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-base md:text-lg font-bold text-text-primary">
              {"Dashboard Overview"}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {"LIVE"}
            </span>
          </div>
          <p className="font-body-sm text-[12px] text-text-muted hidden sm:block">
            {"Continuous physiological monitoring & adaptive recovery model"}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative hidden xl:block w-64">
          <input
            className="w-full bg-surface-container-high/50 border border-white/10 focus:border-primary/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/40 font-body-sm"
            placeholder="Search telemetry, biomarkers..."
            type="text"
            aria-label="Search telemetry and biomarkers"
          />
          <Search
            aria-hidden="true"
            className="reference-icon absolute left-2.5 top-2 text-text-muted text-[16px]"
          />
        </div>
        <div className="relative shrink-0">
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high/60 hover:bg-surface-container-high border border-white/10 hover:border-white/20 rounded-lg text-text-primary font-label-md text-xs whitespace-nowrap transition-colors"
            type="button"
          >
            <CalendarDays
              aria-hidden="true"
              className="reference-icon text-text-secondary text-[16px]"
            />
            <span>{"Last 7 Days"}</span>
            <ChevronDown
              aria-hidden="true"
              className="reference-icon text-text-muted text-[16px]"
            />
          </button>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high/60 hover:bg-surface-container-high border border-white/10 hover:border-primary/40 rounded-lg text-text-primary font-label-md text-xs whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,filter] active:scale-[0.98]"
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className="reference-icon text-primary text-[16px]"
          />
          <span className="hidden sm:inline">{"Sync Data"}</span>
        </button>
        <button
          aria-label="Notifications"
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors relative shrink-0"
          type="button"
        >
          <Bell aria-hidden="true" className="reference-icon text-[20px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span>
        </button>
        <button
          aria-label="Preferences"
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors shrink-0"
          type="button"
        >
          <SlidersHorizontal
            aria-hidden="true"
            className="reference-icon text-[20px]"
          />
        </button>
      </div>
    </header>
  );
}
