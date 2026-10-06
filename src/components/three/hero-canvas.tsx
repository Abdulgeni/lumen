"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Pointer, Quality } from "./hero-scene";

const HeroScene = dynamic(() => import("./hero-scene").then((module) => module.HeroScene), {
  ssr: false,
});

type Mode = "pending" | Quality | "static";

/**
 * Returns "static" (no WebGL) on touch devices, low-core hardware, reduced motion,
 * or when WebGL is unavailable. Three.js is only loaded on capable desktops.
 */
function detectMode(): Mode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return "static";

  // Skip WebGL entirely on touch devices and low-core hardware. The three.js chunk
  // is not worth the main-thread cost on mobile — the CSS gradient fallback still looks great.
  if (window.matchMedia("(pointer: coarse)").matches) return "static";
  if ((navigator.hardwareConcurrency ?? 4) < 6) return "static";

  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return "static";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return "static";
  }

  return "high";
}

export function HeroCanvas() {
  const container = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>("pending");
  const [visible, setVisible] = useState(true);

  // Wait 2.5 s after mount before deciding, so the hero text paints first and the
  // WebGL work happens well after FCP and LCP. Browsers on slow connections never
  // see the three.js download block the initial paint.
  useEffect(() => {
    const decide = () => setMode(detectMode());
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(decide, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(decide, 2000);
    return () => clearTimeout(id);
  }, []);

  // Pause rendering when the hero scrolls out of view.
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Scroll progress and pointer parallax feed the scene through refs, never through
  // React state, so no re-renders happen per frame.
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
      {mode === "high" ? (
        <HeroScene
          quality="high"
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
