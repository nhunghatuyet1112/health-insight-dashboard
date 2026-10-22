import { Badge, Checkbox, Feedback } from "@/components/ui/health-kit";
import { defaultPermissions } from "./entries";
import { metricNames } from "./engine";
import { AlertCircle, LoaderCircle, Check, Unplug, Watch } from "lucide-react";
import { providers } from "./demo";
import { useHealthStore } from "@/stores/health-store";
import { DashboardButton } from "@/features/dashboard/components/DashboardSystem";
export function SourceConnections() {
  const connections = useHealthStore((s) => s.connections);
  const permissions = useHealthStore(s => s.permissions);
  const setPermissions = useHealthStore(s => s.setPermissions);
  const connect = useHealthStore((s) => s.connect);
  const disconnect = useHealthStore((s) => s.disconnect);
  return (
    <div className="source-connections">
      {providers.map((provider) => {
        const connection = connections[provider.id];
        const busy =
          connection.status === "connecting" || connection.status === "syncing";
        return (
          <article className="source-row" key={provider.id}>
            <div className="source-row-heading">
              <Watch size={22} aria-hidden="true" />
              <div>
                <h3>{provider.name}</h3>
                <p>{provider.description}</p>
              </div>
              <Badge tone="synthetic">MOCK</Badge>
            </div>
            <div className="source-state" role="status"><Badge tone={connection.status === "error" ? "danger" : busy ? "info" : connection.connected ? "success" : "neutral"}>
              {connection.status === "error" ? <AlertCircle size={15} aria-hidden="true" /> : busy ? <LoaderCircle className="animate-spin" size={15} aria-hidden="true" /> : connection.connected ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Unplug size={15} aria-hidden="true" />
              )}
              {connection.status === "error"
                ? connection.connected
                  ? "Sync error · previous data retained"
                  : "Connection failed"
                : connection.status.replace(/^./, (s) => s.toUpperCase())}
            </Badge></div>
            <p className="muted">
              {connection.syncedAt
                ? `Last simulated sync: ${new Date(connection.syncedAt).toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" })} · GMT+7`
                : "No data from this source is currently included."}
            </p>
            {connection.error && (
              <Feedback tone="danger">{connection.error}</Feedback>
            )}
            <fieldset className="health-permissions" disabled={busy}>
              <legend>Simulated data permissions</legend>
              {defaultPermissions()[provider.id].map(permission => <Checkbox key={permission} checked={permissions[provider.id].includes(permission)} onChange={event => setPermissions(provider.id, event.target.checked ? [...permissions[provider.id], permission] : permissions[provider.id].filter(p => p !== permission))} >
                {permission === 'workouts' ? 'Workout sessions' : metricNames[permission]}
              </Checkbox>)}
            </fieldset>
            <div className="source-actions">
              <DashboardButton
                loading={busy}
                variant="outline"
                onClick={() => void connect(provider.id)}
              >
                {busy
                  ? "Syncing…"
                  : connection.status === "error"
                    ? "Retry sync"
                    : connection.connected
                      ? "Sync again"
                      : "Connect source"}
              </DashboardButton>
              {(connection.connected || busy) && (
                <DashboardButton variant="destructive" onClick={() => disconnect(provider.id)}>
                  {busy ? "Cancel / Disconnect" : "Disconnect"}
                </DashboardButton>
              )}
              {!busy && (
                <DashboardButton
                  variant="link"
                  type="button"
                  onClick={() => void connect(provider.id, true)}
                >
                  Simulate sync failure
                </DashboardButton>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
