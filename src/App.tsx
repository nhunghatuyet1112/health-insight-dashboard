import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { DashboardContent } from "@/features/dashboard/components/DashboardContent";
import { HealthAssistant } from "@/features/dashboard/components/HealthAssistant";

export default function App() {
  return (
    <div className="synapse-shell relative flex min-h-screen bg-background font-body-md text-text-primary antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:p-3 focus:text-on-primary"
      >
        Skip to content
      </a>
      <div aria-hidden="true" className="ambient-background" />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <DashboardContent />
      </div>
      <HealthAssistant />
    </div>
  );
}
