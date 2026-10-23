import { Card, Select } from "@/components/ui/health-kit";
import type { ReactNode, ComponentProps } from "react";
import {
  Activity,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigate } from "@/features/onboarding/navigation";
import "./dashboard-system.css";
import { useRoute } from "@/features/onboarding/navigation";

/** Fixed visual primitives. See DESIGN.md before changing tokens or geometry. */
export function DashboardPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`dashboard-panel ${className}`}>
      {children}
    </Card>
  );
}
export function DashboardButton({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      {...props}
      className={`dashboard-button ${className}`}
    >
      {children}
    </Button>
  );
}
export function DashboardShell({
  name,
  controls,
  children,
  title = "Dashboard Overview",
}: {
  name: string;
  controls: ReactNode;
  children: ReactNode;
  title?: string;
}) {
  const route = useRoute();
  const pages = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  ];
  const currentPage =
    pages.find((p) => route.startsWith(p.path))?.path ?? "/dashboard";
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  return (
    <div className="synapse-shell dashboard-system">
      <a
        className="dashboard-skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
          scrollTo("main");
        }}
      >
        Skip to dashboard
      </a>
      <div aria-hidden="true" className="ambient-background" />
      <aside className="dashboard-sidebar glass-sidebar">
        <div className="dashboard-sidebar-top">
          <a href="#/" className="dashboard-brand">
            <span>
              <Activity size={20} />
            </span>
            <div>
              <strong>Health Insight</strong>
            </div>
            <i aria-hidden="true" />
          </a>
          <nav aria-label="Dashboard navigation">
            {pages.map(({ path, label, icon: Icon }) => (
              <div className="dashboard-nav-group" key={path}>
              <Button
                variant="ghost"
                key={path}
                className={currentPage === path ? "is-active" : ""}
                aria-current={currentPage === path ? "page" : undefined}
                onClick={() => navigate(path)}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Button>
              </div>
            ))}
          </nav>
        </div>
        <div className="dashboard-profile">
          <span>
            {name
              .trim()
              .split(/\s+/)
              .slice(-2)
              .map((n) => n[0])
              .join("")}
          </span>
          <div>
            <strong>{name}</strong>
            <small>Office Worker</small>
          </div>
        </div>
      </aside>
      <div className="dashboard-workspace">
        <header className="glass-header dashboard-header">
          <div>
            <div className="dashboard-title">
              <h1>{title}</h1>
              <span className="dashboard-baseline"><CalendarDays size={15} aria-hidden="true" />60-Day Fixed Baseline (20/08 - 18/10/2026)</span>
            </div>
          </div>
          <div className="dashboard-header-actions">{controls}</div>
        </header>
        <nav
          className="dashboard-mobile-navigation"
          aria-label="Mobile dashboard navigation"
        >
          <label htmlFor="dashboard-page">Explore</label>
          <Select
            id="dashboard-page"
            value={currentPage}
            onChange={(event) => navigate(event.target.value)}
          >
            {pages.map((page) => (
              <option key={page.path} value={page.path}>
                {page.label}
              </option>
            ))}
          </Select>
        </nav>
        {children}
      </div>
    </div>
  );
}
