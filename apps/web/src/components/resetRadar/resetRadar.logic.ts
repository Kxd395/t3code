import { ResetRadarStatus, type ResetRadarEvent } from "@t3tools/contracts";
import * as Schema from "effect/Schema";

export function validateRadarEndpoint(value: string): string {
  const url = new URL(value.trim());
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "Use a local service URL such as http://127.0.0.1:3100. Remote services are not supported in this phase.",
    );
  }
  return url.origin;
}

function validTime(value: string): boolean {
  return /(?:Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value));
}

const decodeStatus = Schema.decodeUnknownSync(ResetRadarStatus);

export function decodeRadarStatus(raw: unknown): ResetRadarStatus {
  let status: ResetRadarStatus;
  try {
    status = decodeStatus(raw);
  } catch {
    throw new Error("Reset Radar API is incompatible. This app requires synthetic API version 1.");
  }
  const dates = [
    status.generatedAt,
    status.source.lastCheckedAt,
    status.account.lastRefreshedAt,
    ...status.events.flatMap((event) => [
      event.publishedAt,
      event.detectedAt,
      event.earliestAt,
      event.latestAt,
    ]),
  ];
  if (status.events.length > 50 || dates.some((date) => date !== null && !validTime(date))) {
    throw new Error("Reset Radar returned invalid timestamps or too many events.");
  }
  for (const event of status.events) {
    const source = new URL(event.sourceUrl);
    if (
      source.protocol !== "https:" ||
      source.username ||
      source.password ||
      (event.earliestAt === null) !== (event.latestAt === null) ||
      (event.earliestAt !== null &&
        event.latestAt !== null &&
        Date.parse(event.earliestAt) > Date.parse(event.latestAt))
    ) {
      throw new Error("Reset Radar returned invalid source evidence or timing.");
    }
  }
  return status;
}

export function radarFreshness(status: ResetRadarStatus, now: number): string {
  if (Math.abs(now - Date.parse(status.generatedAt)) > 60_000)
    return "Clock or connection timing is unreliable";
  if (!status.source.lastCheckedAt || status.source.state === "disabled")
    return "Live sources disabled";
  const age = now - Date.parse(status.source.lastCheckedAt);
  if (age < -30_000) return "Clock timing is unreliable";
  if (age > 300_000 || status.source.state === "stale") return "Fixture data is stale";
  return "Synthetic fixtures loaded";
}

export function radarEventLabel(event: ResetRadarEvent, now: number): string {
  if (event.lifecycle === "cancelled") return "Reset announcement cancelled";
  if (event.lifecycle === "reported_applied") return "Reset reported live";
  if (event.lifecycle === "announcement_unverified" || event.mechanism === "unknown")
    return "Possible reset announcement";
  if (event.mechanism === "banked") return "Banked reset announced";
  if (
    event.lifecycle === "expired_unconfirmed" ||
    (event.latestAt && Date.parse(event.latestAt) < now)
  )
    return "Awaiting confirmation";
  return event.latestAt
    ? "Automatic reset announced"
    : "Automatic reset announced. Timing unknown.";
}
