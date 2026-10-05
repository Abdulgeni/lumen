import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-xs font-semibold tracking-widest text-gold uppercase">404</p>
      <h1 className="font-display text-5xl font-light">This page could not be found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The link may be broken, or the page may have moved.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </main>
  );
}
