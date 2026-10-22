import { LoadingState } from "@/components/ui/health-kit";
import { Landing } from "@/features/landing/Landing";
import { lazy, Suspense, useEffect } from "react";
const HealthOverview = lazy(() =>
  import("@/features/health/HealthOverview").then((module) => ({
    default: module.HealthOverview,
  })),
);
import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { DashboardContent } from "@/features/dashboard/components/DashboardContent";
import { HealthAssistant } from "@/features/dashboard/components/HealthAssistant";
import { FirstDashboard } from "@/features/onboarding/FirstDashboard";
import { useRoute } from "@/features/onboarding/navigation";
function DemoRedirect() {
  useEffect(() => {
    window.location.replace("#/demo");
  }, []);
  return <main><LoadingState>Opening demo…</LoadingState></main>;
}
export default function App() {
  const route = useRoute();
  if (
    route === "/sign-up" ||
    route === "/sign-in" ||
    route === "/welcome" ||
    route === "/summary" ||
    route === "/onboarding" ||
    route.startsWith("/onboarding/")
  )
    return <DemoRedirect />;
  if (
    route === "/dashboard" ||
    route === "/demo" ||
    route === "/journal" ||
    route === "/goals" ||
    route === "/integrations" ||
    route.startsWith("/insights")
  )
    return (
      <Suspense
        fallback={
          <main className="p-8"><LoadingState>Loading health overview…</LoadingState></main>
        }
      >
        <HealthOverview />
      </Suspense>
    );
  if (route === "/first-day") return <FirstDashboard />;
  if (route === "/reference")
    return (
      <div className="synapse-shell relative flex min-h-screen bg-background font-body-md text-text-primary antialiased">
        <div aria-hidden="true" className="ambient-background" />
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="demo-route-bar">
            Fictional sample telemetry · Alex Rivera{" "}
            <a href="#/">Back to welcome</a>
          </div>
          <DashboardHeader />
          <DashboardContent />
        </div>
        <HealthAssistant />
      </div>
    );
  return <Landing />;
}
