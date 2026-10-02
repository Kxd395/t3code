import * as Schema from "effect/Schema";
import { NonNegativeInt, PositiveInt, TrimmedNonEmptyString } from "./baseSchemas.ts";

export const ResetRadarEvent = Schema.Struct({
  id: TrimmedNonEmptyString,
  revision: PositiveInt,
  groupId: TrimmedNonEmptyString,
  sourceId: TrimmedNonEmptyString,
  authorId: TrimmedNonEmptyString,
  publishedAt: Schema.String,
  detectedAt: Schema.String,
  sourceUrl: Schema.String,
  text: Schema.String,
  mechanism: Schema.Literals(["automatic", "banked", "unknown"]),
  reason: Schema.Literals(["promotion", "compensation", "other", "unknown"]),
  lifecycle: Schema.Literals([
    "announcement_unverified",
    "announced",
    "rolling_out",
    "reported_applied",
    "cancelled",
    "expired_unconfirmed",
  ]),
  audience: Schema.String,
  timingPhrase: Schema.String,
  earliestAt: Schema.NullOr(Schema.String),
  latestAt: Schema.NullOr(Schema.String),
});
export type ResetRadarEvent = typeof ResetRadarEvent.Type;

// The independent monitor has its own protocol; it never reads T3's database.
export const ResetRadarStatus = Schema.Struct({
  apiVersion: Schema.Literal(1),
  mode: Schema.Literal("synthetic"),
  generatedAt: Schema.String,
  source: Schema.Struct({
    state: Schema.Literals(["fixture", "stale", "disabled"]),
    lastCheckedAt: Schema.NullOr(Schema.String),
  }),
  account: Schema.Struct({
    state: Schema.Literal("unavailable"),
    lastRefreshedAt: Schema.NullOr(Schema.String),
  }),
  outbox: Schema.Struct({ channel: Schema.Literal("mock"), queued: NonNegativeInt }),
  events: Schema.Array(ResetRadarEvent),
});
export type ResetRadarStatus = typeof ResetRadarStatus.Type;
