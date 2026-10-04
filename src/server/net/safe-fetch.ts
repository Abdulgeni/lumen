import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import type { LookupFunction } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";
import { isBlockedAddress, parseFetchableUrl, UnsafeUrlError } from "./ip-guard";

export type SafeFetchErrorCode =
  | "INVALID_URL"
  | "BLOCKED_HOST"
  | "TOO_MANY_REDIRECTS"
  | "TIMEOUT"
  | "TOO_LARGE"
  | "UNSUPPORTED_CONTENT"
  | "HTTP_ERROR"
  | "NETWORK_ERROR";

export class SafeFetchError extends Error {
  constructor(
    readonly code: SafeFetchErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SafeFetchError";
  }
}

export type ResponseLike = {
  status: number;
  headers: { get(name: string): string | null };
  body: {
    getReader(): {
      read(): Promise<{ done: boolean; value?: Uint8Array | undefined }>;
      cancel(): Promise<void>;
    };
  } | null;
};

export type FetchLike = (
  url: string,
  init: { redirect: "manual"; signal: AbortSignal; headers: Record<string, string> },
) => Promise<ResponseLike>;

export type SafeFetchOptions = {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  /** Test seam only. Production code always uses the DNS-pinned default. */
  fetchImpl?: FetchLike;
};

export type SafeFetchResult = { url: string; contentType: string; bytes: Uint8Array };

/** Rejects any connection whose resolved addresses are not public. */
export const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true as const }, (error, addresses) => {
    if (error) return callback(error, "", 0);
    const list: LookupAddress[] = addresses;
    if (list.length === 0 || list.some((entry) => isBlockedAddress(entry.address))) {
      const blockedError = Object.assign(new Error("Blocked address"), {
        code: "EBLOCKED",
      }) as NodeJS.ErrnoException;
      return callback(blockedError, "", 0);
    }
    if (options.all) return callback(null, list);
    const first = list[0];
    if (!first) return callback(new Error("No address") as NodeJS.ErrnoException, "", 0);
    return callback(null, first.address, first.family);
  });
};

let agent: Agent | undefined;
const defaultFetch: FetchLike = (url, init) => {
  agent ??= new Agent({ connect: { lookup: guardedLookup } });
  return undiciFetch(url, { ...init, dispatcher: agent }) as unknown as Promise<ResponseLike>;
};

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const ALLOWED_TYPES = new Set(["text/html", "application/xhtml+xml", "text/plain"]);

function validate(href: string): URL {
  try {
    return parseFetchableUrl(href);
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw new SafeFetchError(error.code, error.message);
    throw error;
  }
}

function mapNetworkError(error: unknown, signal: AbortSignal): SafeFetchError {
  if (error instanceof SafeFetchError) return error;
  if (signal.aborted) return new SafeFetchError("TIMEOUT", "That page took too long to respond.");
  const cause = (error as { cause?: { code?: string } } | null)?.cause;
  if (cause?.code === "EBLOCKED") {
    return new SafeFetchError("BLOCKED_HOST", "That address is not publicly reachable.");
  }
  return new SafeFetchError("NETWORK_ERROR", "We could not reach that page.");
}

async function discard(response: ResponseLike) {
  try {
    await response.body?.getReader().cancel();
  } catch {
    /* ignore */
  }
}

async function readBody(response: ResponseLike, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await discard(response);
    throw new SafeFetchError("TOO_LARGE", "That page is too large to summarize.");
  }
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new SafeFetchError("TOO_LARGE", "That page is too large to summarize.");
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function safeFetch(
  input: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const {
    maxBytes = 2 * 1024 * 1024,
    timeoutMs = 10_000,
    maxRedirects = 3,
    fetchImpl = defaultFetch,
  } = options;
  const signal = AbortSignal.timeout(timeoutMs);
  let current = validate(input);

  for (let hop = 0; hop <= maxRedirects; hop++) {
    try {
      const response = await fetchImpl(current.href, {
        redirect: "manual",
        signal,
        headers: {
          "user-agent": "LumenBot/1.0",
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
          "accept-language": "en;q=0.9,*;q=0.5",
        },
      });

      if (REDIRECT_STATUSES.has(response.status)) {
        const location = response.headers.get("location");
        await discard(response);
        if (!location)
          throw new SafeFetchError(
            "HTTP_ERROR",
            "That page redirected without a destination.",
            response.status,
          );
        if (hop === maxRedirects)
          throw new SafeFetchError("TOO_MANY_REDIRECTS", "That link redirects too many times.");
        current = validate(new URL(location, current).href);
        continue;
      }

      if (response.status < 200 || response.status >= 300) {
        await discard(response);
        throw new SafeFetchError(
          "HTTP_ERROR",
          response.status === 401 || response.status === 403
            ? "That page is not publicly accessible."
            : response.status === 404
              ? "That page could not be found."
              : "That page returned an error.",
          response.status,
        );
      }

      const contentType = (response.headers.get("content-type") ?? "text/html").toLowerCase();
      const mime = contentType.split(";")[0]?.trim() ?? "";
      if (!ALLOWED_TYPES.has(mime)) {
        await discard(response);
        throw new SafeFetchError(
          "UNSUPPORTED_CONTENT",
          "That link is not a web page or text document.",
        );
      }

      const bytes = await readBody(response, maxBytes);
      return { url: current.href, contentType, bytes };
    } catch (error) {
      throw mapNetworkError(error, signal);
    }
  }

  throw new SafeFetchError("TOO_MANY_REDIRECTS", "That link redirects too many times.");
}

/** Decodes using the declared charset, then a meta tag, then UTF-8. */
export function decodeBody(bytes: Uint8Array, contentType: string): string {
  const declared = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 2048));
  const sniffed = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  try {
    return new TextDecoder(declared ?? sniffed ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
