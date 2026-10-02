import { describe, expect, it } from "vite-plus/test";
import {
  decodeRadarStatus,
  radarEventLabel,
  radarFreshness,
  validateRadarEndpoint,
} from "./resetRadar.logic";

const now = Date.parse("2026-10-02T12:40:00Z");
const raw = {
  apiVersion: 1,
  mode: "synthetic",
  generatedAt: "2026-10-02T12:40:00Z",
  source: { state: "fixture", lastCheckedAt: "2026-10-02T12:40:00Z" },
  account: { state: "unavailable", lastRefreshedAt: null },
  outbox: { channel: "mock", queued: 1 },
  events: [
    {
      id: "fixture",
      revision: 1,
      groupId: "group",
      sourceId: "source",
      authorId: "synthetic",
      publishedAt: "2026-10-02T12:00:00Z",
      detectedAt: "2026-10-02T12:40:00Z",
      sourceUrl: "https://example.invalid/fixture",
      text: "Synthetic reset in two hours",
      mechanism: "automatic",
      reason: "unknown",
      lifecycle: "announced",
      audience: "Synthetic accounts",
      timingPhrase: "In two hours",
      earliestAt: "2026-10-02T14:00:00Z",
      latestAt: "2026-10-02T14:00:00Z",
    },
  ],
};
const status = decodeRadarStatus(raw);
const event = status.events[0]!;

describe("Reset Radar read-only client", () => {
  it("accepts the local origin and rejects credentials, paths, remote destinations and missing ports", () => {
    expect(validateRadarEndpoint(" http://127.0.0.1:3100/ ")).toBe("http://127.0.0.1:3100");
    for (const url of [
      "https://example.com",
      "http://127.0.0.1",
      "http://user:password@127.0.0.1:3100",
      "http://127.0.0.1:3100/path",
      "http://127.0.0.1:3100?secret=1",
      "http://localhost:3100",
    ])
      expect(() => validateRadarEndpoint(url)).toThrow();
  });
  it("fails visibly on incompatible versions, modes, malformed times and interval bounds", () => {
    expect(() => decodeRadarStatus({ ...raw, apiVersion: 2 })).toThrow("incompatible");
    expect(() => decodeRadarStatus({ ...raw, mode: "live" })).toThrow("incompatible");
    expect(() => decodeRadarStatus({ ...raw, generatedAt: "yesterday" })).toThrow("timestamps");
    expect(() =>
      decodeRadarStatus({ ...raw, events: [{ ...raw.events[0], earliestAt: null }] }),
    ).toThrow("timing");
    expect(() =>
      decodeRadarStatus({
        ...raw,
        events: [{ ...raw.events[0], latestAt: "2026-10-01T00:00:00Z" }],
      }),
    ).toThrow("timing");
    expect(() =>
      decodeRadarStatus({
        ...raw,
        events: [{ ...raw.events[0], sourceUrl: "javascript:alert(1)" }],
      }),
    ).toThrow("evidence");
  });
  it("keeps banked benefits separate from deadline-driven automatic resets", () => {
    expect(radarEventLabel({ ...event, mechanism: "banked" }, now + 3 * 3600_000)).toBe(
      "Banked reset announced",
    );
    expect(radarEventLabel(event, now)).toBe("Automatic reset announced");
    expect(radarEventLabel(event, now + 3 * 3600_000)).toBe("Awaiting confirmation");
  });
  it("does not invent timing for soon or turn an ambiguous report into applied status", () => {
    expect(radarEventLabel({ ...event, earliestAt: null, latestAt: null }, now)).toBe(
      "Automatic reset announced. Timing unknown.",
    );
    expect(radarEventLabel({ ...event, mechanism: "unknown" }, now)).toBe(
      "Possible reset announcement",
    );
    expect(radarEventLabel({ ...event, lifecycle: "reported_applied" }, now)).toBe(
      "Reset reported live",
    );
    expect(status.account.state).toBe("unavailable");
  });
  it("preserves cancellations, expired estimates and explicitly reported completion", () => {
    expect(radarEventLabel({ ...event, lifecycle: "cancelled" }, now)).toContain("cancelled");
    expect(radarEventLabel({ ...event, lifecycle: "expired_unconfirmed" }, now)).toBe(
      "Awaiting confirmation",
    );
  });
  it("distinguishes fixture freshness, disabled sources, stale evidence and clock skew", () => {
    expect(radarFreshness(status, now)).toBe("Synthetic fixtures loaded");
    expect(
      radarFreshness({ ...status, source: { state: "disabled", lastCheckedAt: null } }, now),
    ).toBe("Live sources disabled");
    expect(radarFreshness({ ...status, generatedAt: "2026-10-02T12:50:00Z" }, now)).toContain(
      "unreliable",
    );
    expect(
      radarFreshness(
        { ...status, source: { state: "stale", lastCheckedAt: "2026-10-02T12:00:00Z" } },
        now,
      ),
    ).toBe("Fixture data is stale");
  });
});
