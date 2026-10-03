import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const palette = [
  { name: "Obsidian", swatch: "bg-obsidian", hex: "#0A0A0B" },
  { name: "Surface", swatch: "bg-surface", hex: "#111114" },
  { name: "Surface high", swatch: "bg-surface-high", hex: "#17171B" },
  { name: "Ivory", swatch: "bg-ivory", hex: "#F5F1E8" },
  { name: "Ivory muted", swatch: "bg-ivory-muted", hex: "#A8A398" },
  { name: "Gold", swatch: "bg-gold", hex: "#C8A96A" },
  { name: "Gold light", swatch: "bg-gold-light", hex: "#E6D3A3" },
  { name: "Gold deep", swatch: "bg-gold-deep", hex: "#8F7638" },
  { name: "Emerald accent", swatch: "bg-emerald-accent", hex: "#0F3D33" },
] as const;

const buttonVariantList = [
  "default",
  "gold",
  "outline",
  "secondary",
  "ghost",
  "link",
  "destructive",
] as const;

const badgeVariantList = [
  "default",
  "gold",
  "secondary",
  "outline",
  "emerald",
  "destructive",
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="font-display text-3xl font-light text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-6xl space-y-20 px-5 py-16 sm:px-8 lg:py-24">
      <header className="space-y-4">
        <Badge variant="gold">Internal preview</Badge>
        <h1 className="gold-shimmer font-display text-5xl leading-tight font-light sm:text-7xl">
          Lumen design system
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Obsidian, ivory and champagne gold. Restrained, spacious, precise.
        </p>
      </header>

      <Section title="Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {palette.map((c) => (
            <div key={c.name} className="space-y-2">
              <div className={`${c.swatch} h-20 rounded-xl border border-foreground/10`} />
              <p className="text-sm font-medium">{c.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{c.hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-4">
          <p className="font-display text-6xl font-light">Distilled clarity</p>
          <p className="font-display text-4xl font-medium">Executive brief</p>
          <p className="text-xl font-semibold tracking-tight">Inter semibold, 20px</p>
          <p className="text-base">Body copy in Inter. Quiet, legible, and precise.</p>
          <p className="text-sm text-muted-foreground">Muted caption text in ivory muted.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          {buttonVariantList.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Example icon button">
            +
          </Button>
          <Button disabled>Disabled</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Link styled as button
          </Link>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          {badgeVariantList.map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="Default" />
          <Input placeholder="Disabled" disabled />
          <Input defaultValue="With a value" />
          <Input defaultValue="Invalid" aria-invalid />
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_30%_20%,rgba(200,169,106,0.18),transparent_55%)] p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>Default shadcn card, restyled.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Eighty percent surface with backdrop blur.
            </CardContent>
          </Card>
          <div className="rounded-2xl p-6 glass-panel">
            <p className="font-medium">glass-panel</p>
            <p className="text-sm text-muted-foreground">Navigation and overlays.</p>
          </div>
          <div className="rounded-2xl p-6 glass-card">
            <p className="font-medium">glass-card</p>
            <p className="text-sm text-muted-foreground">Gradient fill with inner highlight.</p>
          </div>
          <div className="gold-gradient-border rounded-2xl bg-card/60 p-6 gold-glow">
            <p className="font-medium">gold hairline</p>
            <p className="text-sm text-muted-foreground">With a soft gold glow.</p>
          </div>
        </div>
      </Section>
    </main>
  );
}
