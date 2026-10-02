import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { SettingsSection } from "../settings/settingsLayout";
import { useResetRadarSettings } from "./resetRadarStore";
import { validateRadarEndpoint } from "./resetRadar.logic";

export function ResetRadarSettings() {
  const settings = useResetRadarSettings();
  const [draft, setDraft] = useState(settings.endpoint);
  const [error, setError] = useState<string | null>(null);
  const save = (enabled: boolean) => {
    try {
      const endpoint = enabled ? validateRadarEndpoint(draft) : settings.endpoint;
      settings.configure(enabled, endpoint);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid service URL.");
    }
  };
  return (
    <SettingsSection id="reset-radar" title="Reset Radar">
      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="radar-enabled" className="font-medium">
            Enable read-only Radar
          </label>
          <Switch
            id="radar-enabled"
            aria-label="Enable read-only Radar"
            checked={settings.enabled}
            onCheckedChange={save}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Synthetic demo only. Live monitoring, account usage, notifications, and execution are
          unavailable in this phase.
        </p>
        <label htmlFor="radar-endpoint" className="block text-sm">
          Local Radar service URL
        </label>
        <Input
          id="radar-endpoint"
          aria-label="Local Radar service URL"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="http://127.0.0.1:3100"
        />
        <p className="text-xs text-muted-foreground">
          This setting belongs to this device. The service must run on the computer displaying the
          app, including when you connect to a remote T3 environment.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            try {
              const endpoint = validateRadarEndpoint(draft);
              settings.configure(settings.enabled, endpoint);
              setError(null);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Invalid service URL.");
            }
          }}
        >
          Save Radar settings
        </Button>
      </div>
    </SettingsSection>
  );
}
