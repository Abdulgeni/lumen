import type { ReactNode } from "react";
import { Ambient } from "@/components/marketing/ambient";
import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <noscript>
        <style>{".reveal{opacity:1;transform:none}"}</style>
      </noscript>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <Ambient />
      <Navbar />
      <main id="main" className="relative pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
