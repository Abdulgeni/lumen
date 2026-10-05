"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Pointer, Quality } from "./hero-scene";

const HeroScene = dynamic(() => import("./hero-scene").then((module) => module.HeroScene), {
  ssr: false,
});

type Mode = "pending" | Quality | "static";

function detectMode(): Mode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return "static";

  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return "static";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return "static";
  }

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return coarsePointer || (navigator.hardwareConcurrency ?? 4) <= 4 ? "low" : "high";
}

export function HeroCanvas() {
  const container = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>("pending");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const decide = () => setMode(detectMode());
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(decide, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(decide, 300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mode === "pending" || mode === "static") return;
    const node = container.current;
    if (!node) return;

    let height = node.offsetHeight || 1;
    const measure = () => {
      height = node.offsetHeight || 1;
    };
    const onScroll = () => {
      progress.current = Math.min(1, Math.max(0, window.scrollY / height));
    };
    const onPointer = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
      };
    };

    onScroll();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer) window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [mode]);

  return (
    <div ref={container} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {mode === "high" || mode === "low" ? (
        <HeroScene
          quality={mode}
          active={visible}
          progress={progress}
          pointer={pointer}
          onFail={() => setMode("static")}
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,11,0.6),transparent_70%)]" />
    </div>
  );
}
