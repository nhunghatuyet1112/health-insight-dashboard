import {
  ChartNoAxesCombined,
  ChevronsUpDown,
  Flag,
  LayoutDashboard,
  Radio,
  Settings,
  TrendingUp,
  Watch,
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 z-30 glass-sidebar flex flex-col justify-between hidden md:flex">
      <div className="p-5 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-primary/40 flex items-center justify-center text-primary group-hover:glow-emerald transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-lg font-bold tracking-tight text-text-primary">
                {"Synapse"}
              </span>
              <span className="font-label-sm text-[10px] text-text-muted tracking-wider uppercase font-mono">
                {"Biometrics OS"}
              </span>
            </div>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-surface-container-high/40 border border-white/5 rounded-lg text-text-secondary font-label-sm text-[11px]">
          <span className="flex items-center gap-1.5 text-text-muted">
            <Radio
              aria-hidden="true"
              className="reference-icon text-primary text-[15px]"
            />
            {" Telemetric Sync "}
          </span>
          <span className="text-emerald-400 font-semibold font-mono">
            {"2m ago"}
          </span>
        </div>
        <nav className="space-y-1.5 font-label-md text-xs">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-text-muted">
            {"Core Portal"}
          </div>
          <a
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-semibold shadow-[0_0_12px_rgba(74,222,128,0.15)] group transition-[color,background-color,border-color,box-shadow,transform,filter]"
            href="#"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                aria-hidden="true"
                className="reference-icon text-[19px] text-primary"
              />
              <span>{"Dashboard"}</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          </a>
          <a
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent transition-[color,background-color,border-color,box-shadow,transform,filter]"
            href="#"
          >
            <div className="flex items-center gap-3">
              <ChartNoAxesCombined
                aria-hidden="true"
                className="reference-icon text-[19px]"
              />
              <span>{"Metrics"}</span>
            </div>
          </a>
          <a
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent transition-[color,background-color,border-color,box-shadow,transform,filter]"
            href="#"
          >
            <div className="flex items-center gap-3">
              <TrendingUp
                aria-hidden="true"
                className="reference-icon text-[19px]"
              />
              <span>{"Trends"}</span>
            </div>
          </a>
          <a
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent transition-[color,background-color,border-color,box-shadow,transform,filter]"
            href="#"
          >
            <div className="flex items-center gap-3">
              <Flag aria-hidden="true" className="reference-icon text-[19px]" />
              <span>{"Goals"}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-container-high text-primary border border-primary/20">
              {"3 Active"}
            </span>
          </a>
          <div className="pt-4 px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-text-muted">
            {"Ecosystem"}
          </div>
          <a
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent transition-[color,background-color,border-color,box-shadow,transform,filter]"
            href="#"
          >
            <div className="flex items-center gap-3">
              <Watch
                aria-hidden="true"
                className="reference-icon text-[19px]"
              />
              <span>{"Wearables & I/O"}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </a>
          <a
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent transition-[color,background-color,border-color,box-shadow,transform,filter]"
            href="#"
          >
            <div className="flex items-center gap-3">
              <Settings
                aria-hidden="true"
                className="reference-icon text-[19px]"
              />
              <span>{"Settings"}</span>
            </div>
          </a>
        </nav>
      </div>
      <div className="p-4 border-t border-white/5 bg-surface-container-low/50">
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-surface-container-high/40 border border-white/5 hover:border-white/10 transition-[color,background-color,border-color,box-shadow,transform,filter] cursor-pointer">
          <div className="relative w-10 h-10 rounded-full bg-surface-container-high border border-white/10 ring-1 ring-primary/40 flex items-center justify-center overflow-hidden shrink-0">
            <img
              alt="Alex Rivera headshot"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6C1Auhrf8ErI7cwmUxeqIaUCmG7TB-HBxTjyK6XhLVj88CXIyb1nyb7u3MPmQ1pQhdVWl8n6n-lKZGEiPj3XBnv1EiF1m3NIer_MQbr31RK6-OgFj2GEWaqc58HRWduNkZAPuaH32l0M9opgri-f3bvD34sT6a4PgdtnaaEpJhi3NdIRCZTuNemTyGf9CLgxoxaTOciDfBo-CxjCqZxdbS9X0UUDZmm-iKvSuTIZBH4X4KHfsdy6c"
              width={40}
              height={40}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-headline-sm text-xs font-semibold text-text-primary truncate">
              {"Alex Rivera, 32"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="font-label-sm text-[10px] text-text-muted truncate font-mono">
                {"Pro Plan Member"}
              </span>
            </div>
          </div>
          <ChevronsUpDown
            aria-hidden="true"
            className="reference-icon text-text-muted text-[18px]"
          />
        </div>
      </div>
    </aside>
  );
}
