export function safeNext(value: string | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost" || !value.startsWith("/")) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
