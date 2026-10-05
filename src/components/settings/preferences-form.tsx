"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/workspace/option-controls";
import { apiRequest } from "@/lib/api-client";
import {
  LENGTH_LABELS,
  type LanguageCode,
  MODE_LABELS,
  OUTPUT_LANGUAGES,
  SUMMARY_LENGTHS,
  SUMMARY_MODES,
  SUMMARY_TONES,
  type SummaryLength,
  type SummaryMode,
  type SummaryTone,
  TONE_LABELS,
} from "@/lib/summary-options";

type Preferences = {
  defaultMode: SummaryMode;
  defaultLength: SummaryLength;
  defaultTone: SummaryTone;
  outputLanguage: LanguageCode;
};

export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await apiRequest("/api/preferences", {
      method: "PUT",
      body: JSON.stringify(value),
    });
    setPending(false);
    if (!result.ok) return void toast.error(result.message);
    toast.success("Defaults saved.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="pref-mode"
          label="Default mode"
          value={value.defaultMode}
          onChange={(defaultMode) => setValue((v) => ({ ...v, defaultMode }))}
          options={SUMMARY_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
        />
        <SelectField
          id="pref-length"
          label="Default length"
          value={value.defaultLength}
          onChange={(defaultLength) => setValue((v) => ({ ...v, defaultLength }))}
          options={SUMMARY_LENGTHS.map((l) => ({ value: l, label: LENGTH_LABELS[l] }))}
        />
        <SelectField
          id="pref-tone"
          label="Default tone"
          value={value.defaultTone}
          onChange={(defaultTone) => setValue((v) => ({ ...v, defaultTone }))}
          options={SUMMARY_TONES.map((t) => ({ value: t, label: TONE_LABELS[t] }))}
        />
        <SelectField
          id="pref-language"
          label="Default language"
          value={value.outputLanguage}
          onChange={(outputLanguage) => setValue((v) => ({ ...v, outputLanguage }))}
          options={OUTPUT_LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        If your plan does not include a default mode, the first available one is used.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save defaults"}
      </Button>
    </form>
  );
}
