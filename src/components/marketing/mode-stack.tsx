"use client";

import { CheckCircle2, Compass, FileText, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";
import { AUTH_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ModeId = "brief" | "points" | "deep";

const TABS = [
  { id: "brief", label: "Executive Brief", icon: FileText, meta: "412 words → 96 words" },
  { id: "points", label: "Key Points", icon: Layers, meta: "412 words → 118 words" },
  { id: "deep", label: "Deep Dive", icon: Sparkles, meta: "412 words → 190 words" },
] as const;

const clamp = (value: number) => Math.max(-20, Math.min(20, value));

function Brief() {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl font-semibold">
        Harbor Lane Coffee: wholesale drives 18% growth
      </h3>
      <p className="text-xs font-semibold tracking-wider text-gold uppercase">Bottom line</p>
      <p className="text-sm leading-relaxed text-foreground/85">
        Revenue reached $2.4 million, up 18% on the previous quarter, led by a new wholesale
        program. Rising bean prices and new staff pushed costs up 11%.
      </p>
      <ul className="space-y-2 pt-1">
        {[
          [
            "Wholesale",
            "Now supplies 31 local offices and is expected to pass retail sales by the end of next year.",
          ],
          ["Costs", "Up 11%, mainly from green coffee prices and six new baristas."],
          ["Next step", "A roasting facility next spring, funded by a $600,000 loan."],
        ].map(([lead, text]) => (
          <li key={lead} className="flex items-start gap-2.5 text-xs text-foreground/80">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>
              <strong className="text-foreground">{lead}:</strong> {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Points() {
  const cards = [
    ["Growth", "Revenue up 18% quarter on quarter to $2.4 million."],
    ["Wholesale", "The new program supplies 31 offices and drives most of the growth."],
    ["Costs", "Up 11% because of bean prices and six new hires."],
    ["Concentration risk", "One importer provides 70% of the company's beans."],
  ];
  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl font-semibold">
        Key points: Harbor Lane Coffee quarter
      </h3>
      <div className="grid gap-3 pt-1 sm:grid-cols-2">
        {cards.map(([lead, text]) => (
          <div key={lead} className="rounded-xl border border-border bg-secondary/50 p-3.5">
            <div className="mb-1 text-xs font-semibold text-gold-light">{lead}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Deep() {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl font-semibold">
        Deep dive: what is driving Harbor Lane&rsquo;s quarter
      </h3>
      <p className="text-xs font-semibold tracking-wider text-gold uppercase">Detailed analysis</p>
      <blockquote className="rounded-r border-l-2 border-gold bg-gold/5 py-1 pl-3.5 text-xs text-gold-light italic">
        Wholesale now supplies 31 local offices and is expected to exceed retail sales by the end of
        next year.
      </blockquote>
      <div className="space-y-2 text-xs leading-relaxed text-foreground/80">
        <p>
          <strong className="text-foreground">Core trade-off:</strong> growth is coming from a
          lower-margin channel while input costs rise 11%.
        </p>
        <p>
          <strong className="text-foreground">Caveat:</strong> 70% of beans come from one importer,
          so a single supply disruption would affect most of the business.
        </p>
      </div>
    </div>
  );
}

export function ModeStack() {
  const [active, setActive] = useState<ModeId>("brief");
  const [tilt, setTilt] = useState({ x: 4, y: -6 });
  const drag = useRef<number | null>(null);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current === null) return;
    const delta = (event.clientX - drag.current) * 0.08;
    drag.current = event.clientX;
    setTilt((previous) => ({ ...previous, y: clamp(previous.y + delta) }));
  };
  const onUp = () => {
    drag.current = null;
  };

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const order = TABS.map((tab) => tab.id);
    const index = order.indexOf(active);
    const next =
      event.key === "ArrowRight"
        ? order[(index + 1) % order.length]
        : event.key === "ArrowLeft"
          ? order[(index - 1 + order.length) % order.length]
          : undefined;
    if (!next) return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];

  return (
    <div className="mx-auto max-w-4xl select-none">
      <div
        role="tablist"
        aria-label="Summary mode"
        className="mb-8 flex flex-wrap items-center justify-center gap-2"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={active === id}
            aria-controls="mode-panel"
            tabIndex={active === id ? 0 : -1}
            onKeyDown={onTabKey}
            onClick={() => setActive(id)}
            className={cn(
              "flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-300",
              active === id
                ? "border-gold/50 bg-gold/15 text-gold-light shadow-[0_0_20px_rgba(200,169,106,0.2)]"
                : "border-border bg-card/80 text-muted-foreground hover:border-gold/30 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      <div
        className="relative cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-r from-gold/10 via-emerald-accent/15 to-gold/5 opacity-60 blur-3xl" />
        <div
          className="relative transition-transform duration-500 ease-out"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-8 -top-6 h-full rounded-3xl border border-border bg-secondary/40 opacity-40"
            style={{ transform: "translateZ(-40px) scale(0.92)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-4 -top-3 h-full rounded-3xl border border-border bg-secondary/60 opacity-70"
            style={{ transform: "translateZ(-20px) scale(0.96)" }}
          />

          <div
            id="mode-panel"
            role="tabpanel"
            aria-labelledby={`tab-${active}`}
            className="relative rounded-3xl border border-foreground/10 bg-card/90 p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(230,211,163,0.15)] backdrop-blur-2xl sm:p-9"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5 text-xs">
              <span className="flex items-center gap-2 font-semibold tracking-widest text-gold uppercase">
                <span className="size-2 rounded-full bg-gold" aria-hidden="true" /> Example output
              </span>
              <span className="text-muted-foreground">{current.meta}</span>
            </div>
            <div className="min-h-64 pt-6">
              {active === "brief" ? <Brief /> : null}
              {active === "points" ? <Points /> : null}
              {active === "deep" ? <Deep /> : null}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Compass className="size-3.5 text-gold" /> Drag to tilt
              </span>
              <Link
                href={AUTH_ROUTES.signUp}
                className="font-medium text-gold-light hover:text-gold"
              >
                Try it on your own text →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Examples were written for this page about a fictional company. Real summaries depend on your
        source.
      </p>
    </div>
  );
}
