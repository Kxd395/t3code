import { useState } from "react";
import { RadarIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
} from "../ui/dialog";
import { ResetRadarSettings } from "./ResetRadarSettings";
import { radarEventLabel, radarFreshness } from "./resetRadar.logic";
import { useResetRadar } from "./useResetRadar";

const time = (value: string | null) =>
  value === null
    ? "Unknown"
    : new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/New_York",
      }).format(new Date(value));

export function ResetRadarControl() {
  const [open, setOpen] = useState(false);
  const { enabled, status, error, refresh, observedAt } = useResetRadar();
  const now = observedAt;
  const freshness = status ? radarFreshness(status, now) : "Waiting for service";
  const label = !enabled
    ? "Off"
    : error
      ? "Disconnected"
      : !status
        ? "Connecting"
        : freshness.includes("stale")
          ? "Stale demo"
          : freshness.includes("unreliable")
            ? "Check clock"
            : "Demo";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="shrink-0 [-webkit-app-region:no-drag]">
        <Button
          variant="outline"
          size="sm"
          aria-label={`Reset Radar: ${label}. Open details`}
          onClick={() => setOpen(true)}
        >
          <RadarIcon aria-hidden />
          <span className="hidden sm:inline">Reset Radar:</span> {label}
        </Button>
      </div>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Reset Radar</DialogTitle>
          <DialogDescription>
            Read-only reset status · Synthetic demo · Times shown in America/New_York
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ResetRadarSettings />
          {enabled ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium" role="status">
                  {error ? "Reset Radar: Monitoring delayed" : freshness}
                </p>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Refresh
                </Button>
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error} Start the local service or check its URL in Radar settings.
                </p>
              ) : null}
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Fixture source checked: {time(status?.source.lastCheckedAt ?? null)}</p>
                <p>Account usage unavailable</p>
                <p>Last quota refresh observed on this account: Unknown</p>
                <p>
                  Last publicly reported reset:{" "}
                  {time(
                    status?.events.find((event) => event.lifecycle === "reported_applied")
                      ?.publishedAt ?? null,
                  )}
                </p>
                <p>
                  Notifications disabled
                  {status ? ` · ${status.outbox.queued} mock outbox records` : ""}
                </p>
              </div>
              {status && status.events.length === 0 ? (
                <p className="text-sm">Reset Radar: No active announcement</p>
              ) : null}
              {status?.events.map((event) => (
                <article
                  key={event.id}
                  className="space-y-2 rounded-lg border border-border/60 p-3"
                >
                  <h3 className="text-sm font-semibold">{radarEventLabel(event, now)}</h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    Synthetic fixture · Revision {event.revision} · {event.mechanism}
                  </p>
                  <blockquote className="text-sm">{event.text}</blockquote>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt>Audience</dt>
                    <dd>{event.audience}</dd>
                    <dt>Timing evidence</dt>
                    <dd>{event.timingPhrase}</dd>
                    <dt>Supported interval</dt>
                    <dd>
                      {event.earliestAt && event.latestAt
                        ? `${time(event.earliestAt)} – ${time(event.latestAt)}`
                        : "Unknown; no countdown"}
                    </dd>
                    <dt>Published</dt>
                    <dd>{time(event.publishedAt)}</dd>
                    <dt>Detected</dt>
                    <dd>{time(event.detectedAt)}</dd>
                    <dt>Source identity</dt>
                    <dd className="break-all">
                      {event.authorId} / {event.sourceId}
                    </dd>
                    <dt>Related event group</dt>
                    <dd>{event.groupId}</dd>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    Example evidence URL: <span className="break-all">{event.sourceUrl}</span>
                  </p>
                </article>
              ))}
            </>
          ) : null}
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
