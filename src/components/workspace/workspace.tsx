"use client";

import { Check, Copy, FileUp, LoaderCircle, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type DragEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MarkdownView } from "@/components/app/markdown-view";
import { Panel } from "@/components/app/panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createLineParser } from "@/lib/ndjson";
import type { PlanId } from "@/lib/plans";
import { ROUTES, summaryHref } from "@/lib/routes";
import {
  LENGTH_LABELS,
  type LanguageCode,
  MODE_LABELS,
  OUTPUT_LANGUAGES,
  SOURCE_TYPES,
  type SourceType,
  SUMMARY_LENGTHS,
  SUMMARY_MODES,
  SUMMARY_TONES,
  type SummaryLength,
  type SummaryMode,
  type SummaryTone,
  TONE_LABELS,
} from "@/lib/summary-options";
import { countWords } from "@/lib/words";
import { splitTitle } from "@/server/ai/prompt";
import type { SummaryEvent } from "@/server/summarize/service";
import { SegmentedControl, SelectField } from "./option-controls";
import { type UpgradeInfo, UpgradeModal } from "./upgrade-modal";

export type WorkspaceProps = {
  plan: {
    id: PlanId;
    name: string;
    modes: SummaryMode[];
    sources: SourceType[];
    maxInputWords: number;
    maxFileBytes: number;
  };
  usage: { used: number; limit: number };
  defaults: { mode: SummaryMode; length: SummaryLength; tone: SummaryTone; language: LanguageCode };
};

type Phase = "idle" | "running" | "done" | "failed";

const SOURCE_LABELS: Record<SourceType, string> = {
  TEXT: "Paste text",
  URL: "Web link",
  FILE: "Upload file",
};
const FILE_EXTENSIONS = ["pdf", "docx", "txt", "md", "markdown"];
const MIN_WORDS = 20;

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function Workspace({ plan, usage, defaults }: WorkspaceProps) {
  const router = useRouter();
  const [source, setSource] = useState<SourceType>("TEXT");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState(defaults);
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("");
  const [title, setTitle] = useState<string>();
  const [summaryId, setSummaryId] = useState<string>();
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string>();
  const [upgrade, setUpgrade] = useState<UpgradeInfo>();
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const deferredText = useDeferredValue(text);
  const words = useMemo(() => countWords(deferredText), [deferredText]);
  const running = phase === "running";
  const outOfCredits = usage.used >= usage.limit;
  const remaining = Math.max(0, usage.limit - usage.used);
  const canUse = (s: SourceType) => plan.sources.includes(s);

  function lock(code: string, message: string) {
    setUpgrade({ code, message, upgradeTo: plan.id === "free" ? "pro" : "team" });
  }

  function chooseFile(next: File | null) {
    if (!next) return setFile(null);
    const extension = next.name.toLowerCase().split(".").pop() ?? "";
    if (!FILE_EXTENSIONS.includes(extension))
      return void setError("Only PDF, DOCX, TXT and Markdown files are supported.");
    if (next.size > plan.maxFileBytes) {
      return void setError(
        `That file is ${formatBytes(next.size)}. Your plan allows ${formatBytes(plan.maxFileBytes)}.`,
      );
    }
    setError(undefined);
    setFile(next);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0] ?? null);
  }

  function validate(): string | null {
    if (source === "TEXT") {
      const count = countWords(text);
      if (count < MIN_WORDS)
        return `Add a little more text to summarize (at least ${MIN_WORDS} words).`;
      if (count > plan.maxInputWords) {
        return `This text has ${count.toLocaleString("en-US")} words. Your plan allows ${plan.maxInputWords.toLocaleString("en-US")}.`;
      }
    }
    if (source === "URL") {
      const valid = (() => {
        try {
          const parsed = new URL(url.trim());
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      })();
      if (!valid) return "Enter a full web address, starting with https://";
    }
    if (source === "FILE" && !file) return "Choose a file to summarize.";
    return null;
  }

  function buildRequest(): RequestInit {
    if (source === "FILE" && file) {
      const form = new FormData();
      form.set("file", file);
      for (const [key, value] of Object.entries({
        mode: options.mode,
        length: options.length,
        tone: options.tone,
        language: options.language,
      })) {
        form.set(key, value);
      }
      return { body: form };
    }
    const common = {
      mode: options.mode,
      length: options.length,
      tone: options.tone,
      language: options.language,
    };
    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        source === "URL"
          ? { sourceType: "URL", url: url.trim(), ...common }
          : { sourceType: "TEXT", text, ...common },
      ),
    };
  }

  function fail(message: string) {
    setError(message);
    setPhase("failed");
  }

  async function handleHttpError(response: Response) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string; upgradeTo?: PlanId | null; resetsAt?: string };
    } | null;
    const info = body?.error;
    const message = info?.message ?? "Something went wrong. Please try again.";
    if (response.status === 402) {
      setPhase("idle");
      setUpgrade({
        code: info?.code ?? "UPGRADE",
        message,
        upgradeTo: info?.upgradeTo ?? null,
        ...(info?.resetsAt ? { resetsAt: info.resetsAt } : {}),
      });
      return;
    }
    const retry = response.headers.get("Retry-After");
    fail(response.status === 429 && retry ? `${message} Try again in ${retry} seconds.` : message);
  }

  async function consume(body: ReadableStream<Uint8Array>, signal: AbortSignal) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let finished = false;
    const parser = createLineParser<SummaryEvent>((event) => {
      if (event.type === "start") setSummaryId(event.id);
      else if (event.type === "delta") setOutput((previous) => previous + event.text);
      else if (event.type === "done") {
        finished = true;
        setTitle(event.title);
        setSummaryId(event.id);
        setTruncated(event.truncated);
        setPhase("done");
      } else {
        finished = true;
        fail(event.message);
      }
    });

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.push(decoder.decode(value, { stream: true }));
      }
      parser.flush();
    } catch {
      if (!signal.aborted) {
        finished = true;
        fail(
          "The connection was interrupted. Unfinished summaries do not count against your quota.",
        );
      }
    }
    if (!finished && !signal.aborted) fail("The summary did not finish. Please try again.");
    router.refresh();
  }

  async function run() {
    const problem = validate();
    if (problem) return void setError(problem);

    setError(undefined);
    setUpgrade(undefined);
    setOutput("");
    setTitle(undefined);
    setSummaryId(undefined);
    setTruncated(false);
    setPhase("running");
    resultRef.current?.scrollIntoView({ block: "start" });

    const controller = new AbortController();
    abortRef.current = controller;
    let response: Response;
    try {
      response = await fetch("/api/summaries", {
        method: "POST",
        signal: controller.signal,
        ...buildRequest(),
      });
    } catch {
      return void (controller.signal.aborted
        ? setPhase("idle")
        : fail("You appear to be offline. Please try again."));
    }
    if (!response.ok || !response.body) return void (await handleHttpError(response));
    await consume(response.body, controller.signal);
  }

  function cancel() {
    abortRef.current?.abort();
    setPhase("idle");
    toast("Cancelled. The credit is returned.");
    setTimeout(() => router.refresh(), 1000);
  }

  function reset() {
    setPhase("idle");
    setOutput("");
    setTitle(undefined);
    setSummaryId(undefined);
    setError(undefined);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(splitTitle(output).body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copying is not available in this browser.");
    }
  }

  const body = phase === "done" ? splitTitle(output).body : output;

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="sr-only">
        {phase === "running"
          ? "Generating your summary."
          : phase === "done"
            ? "Your summary is ready."
            : phase === "failed"
              ? (error ?? "")
              : ""}
      </p>
      <header className="flex flex-col justify-between gap-3 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight">New Distillation</h1>
          <p className="text-sm text-muted-foreground">
            Paste text, add a link, or upload a document.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {remaining} of {usage.limit} summaries left this period
        </p>
      </header>

      {outOfCredits ? (
        <Panel className="flex flex-col items-start justify-between gap-3 border-gold/30 p-5 sm:flex-row sm:items-center">
          <p className="text-sm">You have used all {usage.limit} summaries for this period.</p>
          <Link href={ROUTES.billing} className={buttonVariants({ size: "sm" })}>
            <Sparkles className="size-3.5" /> See plans
          </Link>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="space-y-6 p-6">
          <SegmentedControl
            label="Source"
            value={source}
            onChange={(value) => {
              setSource(value);
              setError(undefined);
            }}
            onLocked={() => lock("SOURCE_NOT_ALLOWED", "File uploads are available on paid plans.")}
            options={SOURCE_TYPES.map((type) => ({
              value: type,
              label: SOURCE_LABELS[type],
              locked: !canUse(type),
            }))}
          />

          {source === "TEXT" ? (
            <div className="space-y-2">
              <label htmlFor="source-text" className="sr-only">
                Text to summarize
              </label>
              <Textarea
                id="source-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste an article, report, transcript, or notes…"
                disabled={running}
              />
              <p
                className={`text-right text-xs ${words > plan.maxInputWords ? "text-red-400" : "text-muted-foreground"}`}
              >
                {words.toLocaleString("en-US")} / {plan.maxInputWords.toLocaleString("en-US")} words
              </p>
            </div>
          ) : null}

          {source === "URL" ? (
            <div className="space-y-2">
              <label htmlFor="source-url" className="sr-only">
                Web address
              </label>
              <Input
                id="source-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/article"
                disabled={running}
              />
              <p className="text-xs text-muted-foreground">
                Works with public articles and text pages. Pages that need you to sign in, or that
                load their content with JavaScript, cannot be read. Paste the text instead.
              </p>
            </div>
          ) : null}

          {source === "FILE" ? (
            file ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  disabled={running}
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="source-file"
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center transition-colors ${dragging ? "border-gold bg-gold/10" : "border-foreground/20 hover:border-gold/50"}`}
              >
                <FileUp className="size-8 text-gold/70" />
                <span className="text-sm font-medium">Drop a file here, or click to choose</span>
                <span className="text-xs text-muted-foreground">
                  PDF, DOCX, TXT or Markdown, up to {formatBytes(plan.maxFileBytes)}
                </span>
                <input
                  id="source-file"
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.markdown"
                  className="sr-only"
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                />
              </label>
            )
          ) : null}

          <SegmentedControl
            label="Mode"
            value={options.mode}
            onChange={(mode) => setOptions((o) => ({ ...o, mode }))}
            onLocked={(mode) =>
              lock("MODE_NOT_ALLOWED", `${MODE_LABELS[mode]} is available on paid plans.`)
            }
            options={SUMMARY_MODES.map((mode) => ({
              value: mode,
              label: MODE_LABELS[mode],
              locked: !plan.modes.includes(mode),
            }))}
          />
          <SegmentedControl
            label="Length"
            value={options.length}
            onChange={(length) => setOptions((o) => ({ ...o, length }))}
            options={SUMMARY_LENGTHS.map((length) => ({
              value: length,
              label: LENGTH_LABELS[length],
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="tone"
              label="Tone"
              value={options.tone}
              onChange={(tone) => setOptions((o) => ({ ...o, tone }))}
              options={SUMMARY_TONES.map((tone) => ({ value: tone, label: TONE_LABELS[tone] }))}
            />
            <SelectField
              id="language"
              label="Output language"
              value={options.language}
              onChange={(language) => setOptions((o) => ({ ...o, language }))}
              options={OUTPUT_LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
            />
          </div>

          {error && phase !== "failed" ? (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <Button size="lg" className="w-full" onClick={run} disabled={running || outOfCredits}>
            {running ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {running ? "Distilling…" : "Distill"}
          </Button>
        </Panel>

        <div ref={resultRef} className="scroll-mt-24">
          <Panel className="min-h-96 p-6 sm:p-8" aria-busy={running}>
            {phase === "idle" && !output ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Sparkles className="size-8 text-gold/40" />
                <p className="max-w-xs text-sm">
                  Your summary appears here, word by word, and is saved to your archive.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {running ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gold uppercase">
                      <LoaderCircle className="size-3.5 animate-spin" /> Distilling
                    </span>
                    <Button variant="ghost" size="sm" onClick={cancel}>
                      Cancel
                    </Button>
                  </div>
                ) : null}

                {phase === "done" && title ? (
                  <h2 className="font-display text-3xl leading-tight font-light">{title}</h2>
                ) : null}

                {phase === "failed" ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-800/40 bg-red-950/30 p-4 text-sm text-red-200"
                  >
                    {error}
                    {output ? (
                      <p className="mt-1 text-xs text-red-300/80">
                        The partial text below was not saved.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {body ? <MarkdownView content={body} /> : null}

                {phase === "done" ? (
                  <div className="space-y-4 border-t border-border pt-4">
                    {truncated ? (
                      <p role="status" className="text-xs text-gold-light">
                        This summary may be cut short. Try a shorter length or a smaller source.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={copy}>
                        {copied ? (
                          <Check className="size-4 text-gold" />
                        ) : (
                          <Copy className="size-4" />
                        )}{" "}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      {summaryId ? (
                        <Link
                          href={summaryHref(summaryId)}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Open in archive
                        </Link>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={reset}>
                        Start another
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <UpgradeModal info={upgrade} onClose={() => setUpgrade(undefined)} />
    </div>
  );
}
