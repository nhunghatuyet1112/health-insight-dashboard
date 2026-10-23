import { Badge, Card, MetricCard, EvidenceCard, Dialog } from "@/components/ui/health-kit";
import { useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Brain,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigate } from "@/features/onboarding/navigation";
import { analyze, difference, format } from "@/features/health/engine";
import { demoProfile } from "@/features/onboarding/profile";
import { portraits } from "./portraits";
import "./landing.css";

const preview = analyze(["apple", "garmin", "strava"], "7d", {
  steps: demoProfile.stepsPerDay,
  sleep: demoProfile.sleepHours,
  active: demoProfile.activeMinutesPerWeek,
});
const previewSource = (metric: "steps" | "restingHeartRateBpm") => [...new Set(preview.current.filter(row => row[metric] !== null).map(row => row.sources[metric]))].map(id => id === "apple" ? "Apple" : id === "garmin" ? "Garmin" : id).join(" + ") || "No source";
const sleepPath = preview.current
  .map((row, i, rows) =>
    row.sleepHours === null
      ? ""
      : `${i === 0 || rows[i - 1].sleepHours === null ? "M" : "L"}${i * 60} ${64 - (row.sleepHours - 5) * 20}`,
  )
  .join(" ");
export function Landing() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [topic, setTopic] = useState<"data" | "privacy">("data");
  const showInfo = (next: "data" | "privacy") => {
    setTopic(next);
    dialog.current?.showModal();
  };
  return (
    <div className="entry-landing">
      <a
        className="entry-skip"
        href="#entry-main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("entry-main")?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="entry-ambient" aria-hidden="true" />
      <header className="entry-header entry-container">
        <a className="entry-brand" href="#/" aria-label="Health Insight home">
          <span className="entry-brand-icon">
            <Activity size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>Health Insight</strong>
            <small>WELLNESS INTELLIGENCE</small>
          </span>
        </a>
        <div className="entry-header-actions">
          <Badge tone="synthetic">Telemetry Demo Preview</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/demo")}
          >
            Explore Demo
          </Button>
        </div>
      </header>
      <main
        id="entry-main"
        className="entry-main entry-container"
        tabIndex={-1}
      >
        <div className="entry-grid">
          <section className="entry-copy">
            <Badge tone="success">
              TRACK · UNDERSTAND · IMPROVE
            </Badge>
            <div className="entry-narrative">
              <h1>
                Understand your health.
                <br />
                <span>Improve your everyday.</span>
              </h1>
              <p>
                Your personal health intelligence companion. Understand
                activity, sleep and recovery, explore meaningful trends and turn
                insights into everyday actions.
              </p>
            </div>
            <div className="entry-benefits">
              <span>
                <LockKeyhole size={15} aria-hidden="true" />
                Privacy-First Biometrics
              </span>
              <span>
                <RefreshCw size={15} aria-hidden="true" />
                Personal Wellness Goals
              </span>
              <span>
                <Brain size={15} aria-hidden="true" />
                Context-Aware AI Assistant
              </span>
            </div>
            <div className="entry-actions">
              <Button
                size="lg"
                onClick={() => navigate("/demo")}
              >
                Explore Demo
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </div>
            <div className="entry-proof">
              <div className="entry-portraits" aria-hidden="true">
                {portraits.map((src, index) => (
                  <span className="entry-portrait" key={src}>
                    <span>{["MA", "JL", "SK"][index]}</span>
                    <img
                      src={src}
                      alt=""
                      width={32}
                      height={32}
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  </span>
                ))}
              </div>
              <p>
                Explore with <strong>Alex</strong>, our fictional
                persona.
                <br />
                <span>60 days of synthetic data</span> · Real AI through a
                server API.
              </p>
            </div>
          </section>
          <section
            className="entry-preview-area"
            aria-label="Illustrative health dashboard preview"
          >
            <div className="entry-preview-glow" aria-hidden="true" />
            <Card className="entry-preview">
              <div className="entry-preview-header">
                <span>
                  <i aria-hidden="true" />
                  YOUR WEEK AT A GLANCE
                </span>
                <small>ILLUSTRATIVE DEMO</small>
              </div>
              <div className="entry-preview-metrics">
                <MetricCard title="Daily steps" value={format(preview.summary.steps.mean)} unit="steps/day" comparison={preview.comparable("steps") ? <span>{format(difference(preview.summary.steps.mean, preview.prior.steps.mean))} steps vs prior</span> : undefined} source={previewSource("steps")} observed={preview.summary.steps.observed} expected={7} detail="Recorded daily average" />
                <MetricCard title="Resting HR" value={format(preview.summary.restingHeartRateBpm.mean)} unit="bpm" comparison={preview.comparable("restingHeartRateBpm") ? <span>{format(difference(preview.summary.restingHeartRateBpm.mean, preview.prior.restingHeartRateBpm.mean), 1)} bpm vs prior</span> : undefined} source={previewSource("restingHeartRateBpm")} observed={preview.summary.restingHeartRateBpm.observed} expected={7} tone="info" detail="Trend, not a health score" />
              </div>
              <div className="entry-sleep">
                <div className="entry-sleep-header">
                  <div>
                    <small>AVERAGE SLEEP</small>
                    <h2>
                      {format(preview.summary.sleepHours.mean, 1)}h{" "}
                      <span>per recorded night</span>
                    </h2>
                  </div>
                  <Badge tone="info">
                    {preview.summary.sleepHours.observed}/7 nights
                  </Badge>
                </div>
                <svg
                  viewBox="0 0 360 64"
                  fill="none"
                  role="img"
                  aria-label="Recorded demo sleep trend; gaps represent missing nights"
                >
                  <defs>
                    <linearGradient
                      id="entry-emerald-fade"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        stopColor="var(--color-primary)"
                        stopOpacity=".35"
                      />
                      <stop
                        offset="1"
                        stopColor="var(--color-primary)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                    <linearGradient
                      id="entry-cyan-line"
                      x1="0"
                      x2="1"
                      y1="0"
                      y2="0"
                    >
                      <stop stopColor="var(--color-accent)" />
                      <stop offset=".5" stopColor="var(--color-primary)" />
                      <stop offset="1" stopColor="var(--color-primary-fixed)" />
                    </linearGradient>
                  </defs>
                  <path
                    d={sleepPath}
                    stroke="url(#entry-cyan-line)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <EvidenceCard title={<><Sparkles size={16} aria-hidden="true" /> Health Insight Companion</>} badge="Code Engine">
                <p>{preview.insights.find((i) => i.pillar === "sleep")?.action}</p>
              </EvidenceCard>
              <div className="entry-preview-footer">
                <span>
                  <ShieldCheck size={12} aria-hidden="true" />
                  Fictional preview values
                </span>
                <span>No live device connected</span>
              </div>
            </Card>
          </section>
        </div>
      </main>
      <footer className="entry-footer entry-container">
        <span>© 2026 Health Insight Intelligence Systems.</span>
        <nav aria-label="Landing information">
          <Button variant="link" size="sm" onClick={() => navigate("/demo")}>Explore Demo</Button>
          <span aria-hidden="true">/</span>
          <Button variant="link" size="sm" onClick={() => showInfo("data")}>Data Sources</Button>
          <span aria-hidden="true">/</span>
          <Button variant="link" size="sm" onClick={() => showInfo("privacy")}>Demo Privacy</Button>
        </nav>
      </footer>
      <Dialog ref={dialog} title={topic === "data" ? "About the demo data" : "Your demo profile"}>
        <p>
          {topic === "data"
            ? "This preview and the dashboard share 60 days of synthetic data for Alex (Aug 20–Oct 18, 2026). Apple Health, Garmin Connect and Strava are simulated sources. No real sensor is connected."
            : "Your goal targets and mock source settings are saved in this browser. There are no accounts or passwords. Questions and the current synthetic analytics are sent through the server to Groq when AI is configured. Chat is not saved to local storage."}
        </p>
        <Button
          size="lg"
          onClick={() => dialog.current?.close()}
        >
          Got it
        </Button>
      </Dialog>
    </div>
  );
}
