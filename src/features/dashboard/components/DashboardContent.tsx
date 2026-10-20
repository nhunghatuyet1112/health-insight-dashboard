import {
  BadgeCheck,
  Brain,
  ChartNoAxesCombined,
  Check,
  CircleCheck,
  CirclePlus,
  Download,
  Droplet,
  Dumbbell,
  Flag,
  Flame,
  Flower2,
  Footprints,
  Heart,
  Moon,
  TrendingUp,
  TriangleAlert,
  Watch,
} from "lucide-react";

export function DashboardContent() {
  return (
    <main
      className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1440px] w-full mx-auto relative z-10 flex-1"
      id="main"
    >
      <section
        className="glass-card rounded-2xl p-6 relative overflow-hidden transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(56, 189, 248, 0.04) 40%, rgba(13, 20, 34, 0.85) 100%)",
        }}
      >
        <div className="absolute right-0 top-0 w-96 h-full bg-linear-to-l from-primary/10 via-secondary/5 to-transparent pointer-events-none"></div>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary font-label-sm text-[11px] font-semibold tracking-wide flex items-center gap-1.5 shadow-[0_0_12px_rgba(74,222,128,0.2)]">
                <BadgeCheck
                  aria-hidden="true"
                  className="reference-icon text-primary text-[14px]"
                />
                {" VITALITY INDEX 88/100 "}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-label-sm text-[11px] font-semibold flex items-center gap-1 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                <TrendingUp
                  aria-hidden="true"
                  className="reference-icon text-secondary text-[14px]"
                />
                {" +4% from last week "}
              </span>
            </div>
            <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              {" Good morning, Alex. Your vitality is "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-emerald-300 to-secondary font-extrabold">
                {"88/100"}
              </span>
              {". "}
            </h2>
            <p className="font-body-md text-sm text-text-secondary leading-relaxed">
              {
                " Optimal recovery score observed following consistent 8.2 hrs sleep and steady aerobic exertion. Cardiovascular stress markers are low, signaling ideal neuromuscular adaptation. "
              }
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-primary to-emerald-400 text-on-primary font-headline-sm text-xs font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-[color,background-color,border-color,box-shadow,transform,filter] shadow-[0_0_16px_rgba(74,222,128,0.3)] whitespace-nowrap shrink-0"
              type="button"
            >
              <CirclePlus
                aria-hidden="true"
                className="reference-icon text-[17px]"
              />
              <span>{"Log Vitals"}</span>
            </button>
            <button
              className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-high/80 border border-white/10 hover:border-white/20 text-text-primary font-headline-sm text-xs font-medium rounded-lg hover:bg-surface-container-high active:scale-[0.98] transition-[color,background-color,border-color,box-shadow,transform,filter] whitespace-nowrap shrink-0"
              type="button"
            >
              <Download
                aria-hidden="true"
                className="reference-icon text-text-secondary text-[17px]"
              />
              <span>{"Export Report"}</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-container-high/60 border border-white/10 hover:border-white/20 text-text-secondary hover:text-text-primary font-headline-sm text-xs rounded-lg hover:bg-surface-container-high transition-colors whitespace-nowrap shrink-0"
              title="Sync Wearable"
              type="button"
            >
              <Watch
                aria-hidden="true"
                className="reference-icon text-[17px]"
              />
              <span className="hidden sm:inline">{"Sync Wearable"}</span>
            </button>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between h-[210px] transition-[color,background-color,border-color,box-shadow,transform,filter]">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs uppercase text-text-secondary tracking-wider">
              {"Daily Activity"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(74,222,128,0.15)] shrink-0">
              <Footprints
                aria-hidden="true"
                className="reference-icon text-[18px]"
              />
            </div>
          </div>
          <div className="my-auto py-2">
            <div className="flex items-baseline space-x-2">
              <span className="font-display-lg text-3xl font-bold text-text-primary tracking-tight">
                {"9,420"}
              </span>
              <span className="font-label-md text-xs text-text-muted font-mono">
                {"/ 10,000 steps"}
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden border border-white/5">
              <div
                className="bg-linear-to-r from-emerald-400 to-primary h-full rounded-full transition-[color,background-color,border-color,box-shadow,transform,filter] duration-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]"
                style={{ width: "94%" }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs font-label-sm">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Flame
                aria-hidden="true"
                className="reference-icon text-[14px]"
              />
              {" 640 kcal "}
            </span>
            <span className="text-text-muted">{"6.8 km total"}</span>
            <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary font-semibold font-mono">
              {"94%"}
            </span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between h-[210px] transition-[color,background-color,border-color,box-shadow,transform,filter]">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs uppercase text-text-secondary tracking-wider">
              {"Sleep Performance"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.15)] shrink-0">
              <Moon aria-hidden="true" className="reference-icon text-[18px]" />
            </div>
          </div>
          <div className="my-auto py-2">
            <div className="flex items-baseline space-x-2">
              <span className="font-display-lg text-3xl font-bold text-text-primary tracking-tight">
                {"8h 14m"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-label-sm text-[11px] font-semibold">
                {"Optimal"}
              </span>
            </div>
            <p className="font-body-sm text-xs text-text-secondary mt-1.5">
              {" Sleep Score: "}
              <strong className="text-text-primary font-semibold">
                {"89 / 100"}
              </strong>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/5 font-label-sm text-[11px]">
            <div className="bg-surface-container-high/40 px-2 py-1 rounded border border-white/5 flex items-center justify-between">
              <span className="text-text-muted text-[10px] uppercase font-mono">
                {"Deep"}
              </span>
              <span className="text-text-primary font-semibold font-mono">
                {"2h 10m"}
              </span>
            </div>
            <div className="bg-surface-container-high/40 px-2 py-1 rounded border border-white/5 flex items-center justify-between">
              <span className="text-text-muted text-[10px] uppercase font-mono">
                {"REM"}
              </span>
              <span className="text-text-primary font-semibold font-mono">
                {"2h 05m"}
              </span>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between h-[210px] transition-[color,background-color,border-color,box-shadow,transform,filter]">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs uppercase text-text-secondary tracking-wider">
              {"Cardiovascular (RHR)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-400/20 flex items-center justify-center text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] shrink-0">
              <Heart
                aria-hidden="true"
                className="reference-icon text-[18px]"
              />
            </div>
          </div>
          <div className="my-auto py-2">
            <div className="flex items-baseline space-x-2">
              <span className="font-display-lg text-3xl font-bold text-text-primary tracking-tight">
                {"58"}
              </span>
              <span className="font-label-md text-xs text-text-secondary">
                {"bpm"}
              </span>
              <span className="font-label-sm text-[11px] text-primary flex items-center ml-auto font-semibold">
                <Check
                  aria-hidden="true"
                  className="reference-icon text-primary text-[14px]"
                />
                {" Stable "}
              </span>
            </div>
            <p className="font-body-sm text-xs text-text-secondary mt-1.5">
              {" Normal resting range: "}
              <span className="text-text-primary font-mono text-[11px]">
                {"52\u201365 bpm"}
              </span>
            </p>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/5 font-label-sm text-xs">
            <span className="text-text-secondary">
              {"HRV: "}
              <strong className="text-text-primary font-mono">{"64 ms"}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high/60 text-secondary border border-secondary/20 text-[10px] font-mono">
              {"Rest Phase"}
            </span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between h-[210px] transition-[color,background-color,border-color,box-shadow,transform,filter]">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs uppercase text-text-secondary tracking-wider">
              {"Nutrition & Hydration"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_10px_rgba(56,189,248,0.15)] shrink-0">
              <Droplet
                aria-hidden="true"
                className="reference-icon text-[18px]"
              />
            </div>
          </div>
          <div className="my-auto py-2">
            <div className="flex items-baseline space-x-2">
              <span className="font-display-lg text-3xl font-bold text-text-primary tracking-tight">
                {"2,150"}
              </span>
              <span className="font-label-md text-xs text-text-muted font-mono">
                {"/ 2,400 kcal"}
              </span>
            </div>
            <div className="flex items-center justify-between text-text-secondary font-body-sm text-xs mt-1.5">
              <span>{"Water intake"}</span>
              <span className="font-label-sm text-xs font-semibold text-secondary font-mono">
                {"2.4L / 3.0L"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-white/5 font-label-sm text-[11px] text-center">
            <div className="bg-surface-container-high/40 py-1 rounded border border-white/5">
              <span className="text-text-muted block text-[9px] font-mono">
                {"P"}
              </span>
              <span className="text-text-primary font-semibold font-mono">
                {"145g"}
              </span>
            </div>
            <div className="bg-surface-container-high/40 py-1 rounded border border-white/5">
              <span className="text-text-muted block text-[9px] font-mono">
                {"C"}
              </span>
              <span className="text-text-primary font-semibold font-mono">
                {"210g"}
              </span>
            </div>
            <div className="bg-surface-container-high/40 py-1 rounded border border-white/5">
              <span className="text-text-muted block text-[9px] font-mono">
                {"F"}
              </span>
              <span className="text-text-primary font-semibold font-mono">
                {"65g"}
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card rounded-xl p-card-padding">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-text-primary">
                  {"Activity & Recovery Trends"}
                </h3>
                <p className="font-body-sm text-xs text-text-secondary">
                  {
                    "Telemetry aggregation over the past 7 daily observation cycles"
                  }
                </p>
              </div>
              <div className="flex items-center p-1 bg-surface-container-high/60 border border-white/10 rounded-lg self-start shrink-0">
                <button
                  className="px-3 py-1 bg-primary/20 border border-primary/30 shadow-xs rounded text-primary font-label-md text-xs whitespace-nowrap"
                  type="button"
                >
                  {"Activity"}
                </button>
                <button
                  className="px-3 py-1 text-text-secondary hover:text-text-primary font-label-md text-xs transition-colors whitespace-nowrap"
                  type="button"
                >
                  {"Heart Rate"}
                </button>
                <button
                  className="px-3 py-1 text-text-secondary hover:text-text-primary font-label-md text-xs transition-colors whitespace-nowrap"
                  type="button"
                >
                  {"Sleep Quality"}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div
                className="h-60 w-full flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-white/10 relative"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
                }}
              >
                <div className="absolute inset-x-0 top-1/4 border-b border-white/5 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-2/4 border-b border-white/5 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-3/4 border-b border-white/5 pointer-events-none"></div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-emerald-600 to-primary rounded-t shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 group-hover:brightness-125"
                      style={{ height: "72%" }}
                      title="Steps: 8,400"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-950 to-indigo-500/80 border-t border-indigo-400 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.2)]"
                      style={{ height: "60%" }}
                      title="Sleep: 7.2h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    {"Mon"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-emerald-600 to-primary rounded-t shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 group-hover:brightness-125"
                      style={{ height: "85%" }}
                      title="Steps: 9,800"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-950 to-indigo-500/80 border-t border-indigo-400 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.2)]"
                      style={{ height: "68%" }}
                      title="Sleep: 7.8h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    {"Tue"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-emerald-600 to-primary rounded-t shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 group-hover:brightness-125"
                      style={{ height: "60%" }}
                      title="Steps: 6,900"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-950 to-indigo-500/80 border-t border-indigo-400 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.2)]"
                      style={{ height: "80%" }}
                      title="Sleep: 8.4h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    {"Wed"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-emerald-600 to-primary rounded-t shadow-[0_0_14px_rgba(74,222,128,0.3)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 group-hover:brightness-125"
                      style={{ height: "95%" }}
                      title="Steps: 11,200"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-950 to-indigo-500/80 border-t border-indigo-400 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.2)]"
                      style={{ height: "75%" }}
                      title="Sleep: 7.9h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    {"Thu"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-emerald-600 to-primary rounded-t shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 group-hover:brightness-125"
                      style={{ height: "78%" }}
                      title="Steps: 8,900"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-950 to-indigo-500/80 border-t border-indigo-400 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.2)]"
                      style={{ height: "70%" }}
                      title="Sleep: 7.5h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    {"Fri"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-emerald-600 to-primary rounded-t shadow-[0_0_12px_rgba(74,222,128,0.25)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300 group-hover:brightness-125"
                      style={{ height: "88%" }}
                      title="Steps: 10,100"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-950 to-indigo-500/80 border-t border-indigo-400 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.2)]"
                      style={{ height: "88%" }}
                      title="Sleep: 8.5h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                    {"Sat"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-primary via-emerald-400 to-emerald-300 rounded-t shadow-[0_0_18px_rgba(74,222,128,0.5)] transition-[color,background-color,border-color,box-shadow,transform,filter] duration-300"
                      style={{ height: "92%" }}
                      title="Steps: 9,420 (Active)"
                    ></div>
                    <div
                      className="w-full max-w-[20px] bg-linear-to-t from-indigo-900 to-indigo-400 border-t-2 border-cyan-300 rounded-t shadow-[0_0_14px_rgba(56,189,248,0.35)]"
                      style={{ height: "85%" }}
                      title="Sleep: 8.2h"
                    ></div>
                  </div>
                  <span className="font-label-sm text-xs font-semibold text-primary drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">
                    {"Sun"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1 font-label-sm text-xs text-text-secondary">
                <div className="flex items-center space-x-5">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded bg-primary shadow-[0_0_8px_rgba(74,222,128,0.5)] inline-block"></span>
                    <span className="text-slate-300">{"Active Steps"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)] inline-block"></span>
                    <span className="text-slate-300">{"Sleep Duration"}</span>
                  </div>
                </div>
                <div className="text-text-muted">
                  {" Weekly Target Convergence: "}
                  <span className="text-primary font-semibold font-mono">
                    {"96.4%"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-card-padding">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-text-primary">
                  {"Recent Recorded Activities"}
                </h3>
                <p className="font-body-sm text-xs text-text-secondary">
                  {"Automated session detection from synced sensors"}
                </p>
              </div>
              <button
                className="text-primary hover:text-emerald-300 font-label-md text-xs underline underline-offset-4 transition-colors shrink-0"
                type="button"
              >
                {" View Log History "}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-surface-container-high/30 hover:bg-surface-container-high/60 hover:border-primary/30 transition-[color,background-color,border-color,box-shadow,transform,filter]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(74,222,128,0.15)]">
                    <Footprints
                      aria-hidden="true"
                      className="reference-icon text-[20px]"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-sm font-semibold text-text-primary">
                      {"Morning 5k Run"}
                    </h4>
                    <div className="flex items-center space-x-2 font-label-sm text-xs text-text-secondary">
                      <span>{"Today, 06:45 AM"}</span>
                      <span>{"\u2022"}</span>
                      <span className="font-mono">{"Pace: 5'14\"/km"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-label-md text-xs font-semibold text-text-primary font-mono">
                    {"26:14"}
                  </div>
                  <div className="font-label-sm text-xs text-primary flex items-center justify-end gap-1">
                    <Flame
                      aria-hidden="true"
                      className="reference-icon text-primary text-[13px]"
                    />
                    {" 312 kcal "}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-surface-container-high/30 hover:bg-surface-container-high/60 hover:border-secondary/30 transition-[color,background-color,border-color,box-shadow,transform,filter]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_10px_rgba(56,189,248,0.15)]">
                    <Dumbbell
                      aria-hidden="true"
                      className="reference-icon text-[20px]"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-sm font-semibold text-text-primary">
                      {"Strength Conditioning"}
                    </h4>
                    <div className="flex items-center space-x-2 font-label-sm text-xs text-text-secondary">
                      <span>{"Yesterday, 05:15 PM"}</span>
                      <span>{"\u2022"}</span>
                      <span>{"Full Body Hypertrophy"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-label-md text-xs font-semibold text-text-primary font-mono">
                    {"45 mins"}
                  </div>
                  <div className="font-label-sm text-xs text-secondary flex items-center justify-end gap-1">
                    <Flame
                      aria-hidden="true"
                      className="reference-icon text-secondary text-[13px]"
                    />
                    {" 280 kcal "}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-surface-container-high/30 hover:bg-surface-container-high/60 hover:border-indigo-400/30 transition-[color,background-color,border-color,box-shadow,transform,filter]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.15)]">
                    <Flower2
                      aria-hidden="true"
                      className="reference-icon text-[20px]"
                    />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-sm font-semibold text-text-primary">
                      {"Evening Meditation"}
                    </h4>
                    <div className="flex items-center space-x-2 font-label-sm text-xs text-text-secondary">
                      <span>{"Yesterday, 09:30 PM"}</span>
                      <span>{"\u2022"}</span>
                      <span>{"Box Breathing (HRV reset)"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-label-md text-xs font-semibold text-text-primary font-mono">
                    {"15 mins"}
                  </div>
                  <div className="font-label-sm text-xs text-emerald-400 font-mono">
                    {"Mindful Rest"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-xl p-card-padding">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-base font-bold text-text-primary">
                {"Active Wellness Goals"}
              </h3>
              <Flag
                aria-hidden="true"
                className="reference-icon text-secondary text-[18px]"
              />
            </div>
            <div className="space-y-3.5">
              <div className="p-3 bg-surface-container-high/30 border border-white/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-label-md text-xs">
                  <span className="text-text-primary font-semibold">
                    {"Weekly Cardio Goal"}
                  </span>
                  <span className="text-primary font-bold font-mono">
                    {"4 / 5 days"}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-emerald-500 to-primary h-full rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                    style={{ width: "80%" }}
                  ></div>
                </div>
                <p className="font-body-sm text-[11px] text-text-secondary">
                  {"1 session remaining to fulfill aerobic capacity threshold."}
                </p>
              </div>
              <div className="p-3 bg-surface-container-high/30 border border-white/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-label-md text-xs">
                  <span className="text-text-primary font-semibold">
                    {"Hydration Target"}
                  </span>
                  <span className="text-secondary font-bold font-mono">
                    {"Streak: 6 days"}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-blue-500 to-secondary h-full rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                    style={{ width: "75%" }}
                  ></div>
                </div>
                <p className="font-body-sm text-[11px] text-text-secondary">
                  {
                    "2.4L logged today. Target 3.0L reachable with evening intake."
                  }
                </p>
              </div>
              <div className="p-3 bg-surface-container-high/30 border border-white/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-label-md text-xs">
                  <span className="text-text-primary font-semibold">
                    {"Recovery Rest Window"}
                  </span>
                  <span className="text-indigo-400 font-bold font-mono">
                    {"8h / night"}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-indigo-500 to-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                    style={{ width: "100%" }}
                  ></div>
                </div>
                <p className="font-body-sm text-[11px] text-text-secondary">
                  {
                    "Sleep target maintained consistently for 7 consecutive days."
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-card-padding relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(74,222,128,0.2)]">
                <Brain
                  aria-hidden="true"
                  className="reference-icon text-[18px]"
                />
              </div>
              <h3 className="font-headline-sm text-sm font-bold text-text-primary">
                {"AI Clinical Insights"}
              </h3>
            </div>
            <p className="font-body-sm text-xs text-text-secondary mb-3">
              {
                " Continuous Bayesian physiological model synthesis updated 15m ago. "
              }
            </p>
            <ul className="space-y-2.5 font-body-sm text-xs text-text-primary">
              <li className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-surface-container-high/40 border border-white/5">
                <ChartNoAxesCombined
                  aria-hidden="true"
                  className="reference-icon text-primary text-[17px] mt-0.5 shrink-0"
                />
                <p className="text-slate-200">
                  {"Elevated HRV (64ms vs baseline 56ms) suggests "}
                  <strong className="font-semibold text-primary">
                    {"high readiness"}
                  </strong>
                  {" for high-intensity exertion."}
                </p>
              </li>
              <li className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-surface-container-high/40 border border-white/5">
                <TriangleAlert
                  aria-hidden="true"
                  className="reference-icon text-amber-400 text-[17px] mt-0.5 shrink-0"
                />
                <p className="text-slate-200">
                  {
                    "Hydration dip detected at 3 PM; replenish electrolytes prior to evening run."
                  }
                </p>
              </li>
              <li className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-surface-container-high/40 border border-white/5">
                <CircleCheck
                  aria-hidden="true"
                  className="reference-icon text-secondary text-[17px] mt-0.5 shrink-0"
                />
                <p className="text-slate-200">
                  {
                    "Sleep efficiency score peaked at 94% with 2h 10m deep restorative cycles."
                  }
                </p>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between font-label-sm text-[10px] text-text-muted">
              <span className="font-mono">{"Model: Synapse-Health-v4.2"}</span>
              <span className="text-primary font-medium cursor-pointer hover:underline">
                {"View Citations"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
