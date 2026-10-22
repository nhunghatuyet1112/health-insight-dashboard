import { AIChatbot } from "@/features/dashboard/components/AIChatbot";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Brain,
  Check,
  ChevronRight,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  Moon,
  Pencil,
  Plus,
  Target,
  Watch,
  X,
} from "lucide-react";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { activities, ageAt, clockLabel, goalName } from "./profile";
import { navigate } from "./navigation";
import {
  DashboardShell,
  DashboardPanel as Panel,
  DashboardButton as Secondary,
} from "@/features/dashboard/components/DashboardSystem";
export function FirstDashboard() {
  const {
    profile: p,
    waterLogged,
    stepsLogged,
    sleepLogged,
    addWater,
    logEntry,
  } = useOnboardingStore();
  const [notice, setNotice] = useState("");
  const [entry, setEntry] = useState<"steps" | "sleep" | null>(null);
  const [entryValue, setEntryValue] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (entry) dialogRef.current?.showModal();
  }, [entry]);
  const a = activities.find((x) => x.id === p.activity)!;
  const firstName = p.name.trim().split(/\s+/).slice(-2).join(" ");
  const pairing = () =>
    setNotice(
      "Wearable connection is a UI preview. No device is paired. Use the sample dashboard to explore fictional telemetry.",
    );
  const openEntry = (kind: "steps" | "sleep") => {
    setEntry(kind);
    setEntryValue(
      kind === "steps"
        ? String(stepsLogged)
        : String(sleepLogged ?? p.sleepHours),
    );
  };
  const done = 1 + (waterLogged > 0 ? 1 : 0) + (sleepLogged !== null ? 1 : 0);
  return (
    <DashboardShell
      name={p.name}
      controls={
        <Secondary onClick={() => navigate("/goals")}>
          <Pencil size={14} />
          Edit Profile
        </Secondary>
      }
    >
      <main id="main" tabIndex={-1} className="dashboard-main">
        <Panel className="dashboard-hero">
          <div>
            <span className="dashboard-label">
              Primary Focus: {goalName(p.primary)}
            </span>
            <h2>
              Welcome, {firstName}.<br />
              Your baseline is established.
            </h2>
            <p>
              Your dashboard is configured around your{" "}
              <strong>{p.sleepHours}h sleep target</strong>,{" "}
              <strong>
                {p.stepsPerDay.toLocaleString("en-US")} daily steps
              </strong>
              , and{" "}
              <strong>{p.waterLitres.toFixed(1)}L hydration baseline</strong>.
              Log your first entry to start building your history.
            </p>
          </div>
          <div className="dashboard-hero-actions">
            <Secondary
              variant="default"
              onClick={() => openEntry("steps")}
            >
              <Plus size={17} />
              Log First Entry
            </Secondary>
            <Secondary onClick={pairing}>
              <Watch size={17} />
              Connect a Wearable
            </Secondary>
          </div>
        </Panel>
        <div id="health-metrics" className="dashboard-kpis">
          {[
            {
              label: "Daily Motion",
              icon: Footprints,
              value: stepsLogged.toLocaleString("en-US"),
              unit: `/ ${p.stepsPerDay.toLocaleString("en-US")} steps`,
              detail: `Baseline: ${a.title}`,
              foot: stepsLogged > 0 ? "Manually entered" : "No entries yet",
            },
            {
              label: "Sleep Baseline",
              icon: Moon,
              value: String(sleepLogged ?? p.sleepHours),
              unit: sleepLogged === null ? "hrs target" : "hrs logged",
              detail: `${clockLabel(p.bedtime)} – ${clockLabel(p.wakeTime)}`,
              foot:
                sleepLogged === null
                  ? "Log tonight’s sleep"
                  : "Manually entered",
            },
            {
              label: "Cardiovascular",
              icon: Heart,
              value: "—",
              unit: "bpm resting",
              detail: "No resting heart rate recorded",
              foot: "Awaiting measurements",
            },
            {
              label: "Daily Hydration",
              icon: Droplets,
              value: waterLogged.toFixed(2),
              unit: `/ ${p.waterLitres.toFixed(1)} L`,
              detail: p.diet,
              foot: waterLogged > 0 ? "Manually entered" : "Ready to record",
            },
          ].map(({ label, icon: Icon, value, unit, detail, foot }, index) => (
            <Panel
              key={label}
              className={`dashboard-kpi dashboard-kpi-${["green", "accent", "secondary", "tertiary"][index]}`}
            >
              <span>
                {label}
                <Icon size={20} />
              </span>
              <div>
                <strong>{value}</strong>
                <small>{unit}</small>
              </div>
              <p>{detail}</p>
              <footer>
                {foot}
                {label === "Daily Hydration" && (
                  <button
                    aria-label="Log 250 millilitres of water"
                    onClick={addWater}
                  >
                    <Plus size={13} />
                    250ml
                  </button>
                )}
              </footer>
            </Panel>
          ))}
        </div>
        <div className="dashboard-content-grid">
          <div>
            <Panel>
              <div className="section-heading">
                <h2 id="health-trends">Telemetry & Biometric Trends</h2>
                <span>DAY 1</span>
              </div>
              <p className="muted">Your observations over time</p>
              <div className="empty-trends">
                <Activity size={38} />
                <h3>No historical telemetry yet</h3>
                <p>
                  One entry is a starting point. Trends appear when you have
                  observations across multiple days.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Secondary
                    variant="default"
                    onClick={() => navigate("/demo")}
                  >
                    Explore Sample Telemetry
                  </Secondary>
                  <Secondary onClick={pairing}>Sync Wearables</Secondary>
                </div>
              </div>
            </Panel>
            <Panel className="mt-6">
              <div className="section-heading">
                <h2>First 7 Days Milestone Checklist</h2>
                <span>{done} / 4 completed</span>
              </div>
              {[
                {
                  title: "Complete health profile & lifestyle onboarding",
                  detail: `Targets: ${p.sleepHours}h sleep, ${p.stepsPerDay.toLocaleString("en-US")} steps`,
                  done: true,
                  label: "Done",
                  action: () => navigate("/goals"),
                },
                {
                  title: "Pair a biometric wearable",
                  detail: "Explore Apple Watch, Oura or WHOOP integration",
                  done: false,
                  label: "Pair Sensor",
                  action: pairing,
                },
                {
                  title: "Log your first glass of water",
                  detail: "Add 250ml to start your hydration timeline",
                  done: waterLogged > 0,
                  label: waterLogged > 0 ? "Logged" : "Log Water",
                  action: addWater,
                },
                {
                  title: "Record your first sleep session",
                  detail: `Your preferred window starts at ${clockLabel(p.bedtime)}`,
                  done: sleepLogged !== null,
                  label: sleepLogged !== null ? "Logged" : "Log Sleep",
                  action: () => openEntry("sleep"),
                },
              ].map((m, i) => (
                <div className="milestone" key={m.title}>
                  <span className={m.done ? "complete" : ""}>
                    {m.done ? <Check size={16} /> : i + 1}
                  </span>
                  <div>
                    <strong>{m.title}</strong>
                    <small>{m.detail}</small>
                  </div>
                  <button onClick={m.action}>
                    {m.label}
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </Panel>
          </div>
          <div>
            <Panel>
              <div className="section-heading">
                <h2 id="health-goals">Active Wellness Goals</h2>
                <Target size={18} />
              </div>
              <p className="muted mb-5">Configured from your intake survey</p>
              <div className="dashboard-goals">
                {[p.primary, ...p.goals.filter((g) => g !== p.primary)].map(
                  (g) => (
                    <div key={g}>
                      <span>
                        {g === "sleep" ? (
                          <Moon />
                        ) : g === "fitness" ? (
                          <Dumbbell />
                        ) : (
                          <Target />
                        )}
                        <strong>{goalName(g)}</strong>
                      </span>
                      <p>
                        {g === "sleep"
                          ? `${p.sleepHours}h target · ${p.quality} recent quality`
                          : g === "fitness"
                            ? `${p.workouts} · ${p.stepsPerDay.toLocaleString("en-US")} daily steps`
                            : g === "energy"
                              ? `${p.waterLitres.toFixed(1)}L water · regular breaks`
                              : "Build a consistent routine and log your progress."}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </Panel>
            <Panel className="mt-6 observation-panel">
              <div className="section-heading">
                <Brain />
                <h2>Your Starting Point</h2>
              </div>
              <p>
                Your primary focus is {goalName(p.primary).toLowerCase()}. Start
                by recording one activity and a glass of water today. We’ll need
                observations before describing any trend.
              </p>
              <span className="data-caption">
                PROFILE SUMMARY · NO LLM CONNECTED
              </span>
            </Panel>
          </div>
        </div>
        <p id="health-source" className="health-source-note">
          No sensors paired. Manual entries are saved only in this browser.
        </p>
      </main>
      {notice && (
        <div className="dashboard-notice" role="status">
          <InfoMark />
          <p>{notice}</p>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <X size={18} />
          </button>
        </div>
      )}
      {entry && (
        <dialog
          ref={dialogRef}
          onCancel={() => setEntry(null)}
          aria-labelledby="entry-title"
          className="glass-card dashboard-panel dashboard-entry-dialog"
        >
          <button
            className="dialog-close"
            aria-label="Close entry"
            onClick={() => setEntry(null)}
          >
            <X />
          </button>
          <h2 id="entry-title">
            Log {entry === "steps" ? "Daily Steps" : "Sleep Duration"}
          </h2>
          <p className="muted mb-5">Add a manual demo observation for today.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              logEntry(entry, Number(entryValue));
              setEntry(null);
            }}
          >
            <label className="dashboard-field">
              <span>{entry === "steps" ? "Steps" : "Hours slept"}</span>
              <input
                autoFocus
                required
                type="number"
                min={0}
                max={entry === "steps" ? 100000 : 24}
                step={entry === "steps" ? 1 : 0.25}
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
              />
            </label>
            <div className="mt-5">
              <Secondary variant="default" type="submit">
                Save Entry
              </Secondary>
            </div>
          </form>
        </dialog>
      )}
      <AIChatbot
        greeting={`Hi ${firstName}! Your profile is focused on ${goalName(p.primary).toLowerCase()}, with a ${p.sleepHours}h sleep target and ${p.waterLitres.toFixed(1)}L hydration target.`}
        sourceLabel="Your onboarding profile · No sensor data"
        suggestions={[
          "Summarize my health profile",
          "What should I focus on today?",
        ]}
        initialExchange={{
          question: "What should I focus on today?",
          answer:
            "Start with one observation: log your activity, a glass of water or your latest sleep. No trends are available yet.",
        }}
        onAsk={(question) =>
          /summar|profile/i.test(question)
            ? `${p.name}, ${ageAt(p.dob)}. ${a.title}, exercise ${p.workouts}, ${p.quality.toLowerCase()} recent sleep quality, and ${p.diet.toLowerCase()}.`
            : "Start with one observation: log your activity, a glass of water or your latest sleep. No trends are available yet."
        }
      />
    </DashboardShell>
  );
}
function InfoMark() {
  return <ShieldIcon />;
}
function ShieldIcon() {
  return <Activity size={20} />;
}
