import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { env } from "@/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: "Lumen", template: "%s | Lumen" },
  description: "Lumen turns long articles, reports, and documents into clear AI summaries.",
  openGraph: {
    type: "website",
    siteName: "Lumen",
    title: "Lumen: every long read, distilled",
    description: "Turn articles, reports, and documents into clear briefs in seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumen: every long read, distilled",
    description: "Turn articles, reports, and documents into clear briefs in seconds.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-dvh selection:bg-primary/25 selection:text-primary">
        <div className="grain-overlay" aria-hidden="true" />
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
