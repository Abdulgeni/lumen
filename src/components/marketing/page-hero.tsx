import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center sm:pt-28">
      <p className="mb-4 text-xs font-semibold tracking-widest text-gold uppercase">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="gold-shimmer font-normal italic">{accent}</span>
          </>
        ) : null}
      </h1>
      {children ? (
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed font-light text-muted-foreground sm:text-lg">
          {children}
        </p>
      ) : null}
    </header>
  );
}
