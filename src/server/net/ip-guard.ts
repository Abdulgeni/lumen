import { BlockList, isIP } from "node:net";

const blocked = new BlockList();

const IPV4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local, including cloud metadata (169.254.169.254)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, includes 255.255.255.255
];

const IPV6_RANGES: [string, number][] = [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96], // NAT64
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 32], // Teredo
  ["2001:db8::", 32],
  ["2002::", 16], // 6to4
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10],
  ["ff00::", 8], // multicast
];

for (const [network, prefix] of IPV4_RANGES) blocked.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of IPV6_RANGES) blocked.addSubnet(network, prefix, "ipv6");

/** True for anything that is not a plain, publicly routable address. Unknown input counts as blocked. */
export function isBlockedAddress(address: string): boolean {
  const clean = address.split("%")[0] ?? "";
  const family = isIP(clean);
  if (family === 0) return true;
  return blocked.check(clean, family === 4 ? "ipv4" : "ipv6");
}

export class UnsafeUrlError extends Error {
  constructor(
    readonly code: "INVALID_URL" | "BLOCKED_HOST",
    message: string,
  ) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".private",
];
const ALLOWED_PORTS = new Set(["", "80", "443"]);

/** Validates a user-supplied link before any network activity. */
export function parseFetchableUrl(input: string): URL {
  if (input.length > 2048) throw new UnsafeUrlError("INVALID_URL", "That link is too long.");

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new UnsafeUrlError("INVALID_URL", "That does not look like a valid link.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("INVALID_URL", "Only http and https links are supported.");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("INVALID_URL", "Links with embedded credentials are not supported.");
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UnsafeUrlError("BLOCKED_HOST", "Only standard web ports are supported.");
  }

  const host = url.hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
  if (!host) throw new UnsafeUrlError("INVALID_URL", "That does not look like a valid link.");
  if (isIP(host) !== 0) {
    throw new UnsafeUrlError("BLOCKED_HOST", "Links to IP addresses are not supported.");
  }
  if (
    host === "localhost" ||
    !host.includes(".") ||
    BLOCKED_SUFFIXES.some((s) => host.endsWith(s))
  ) {
    throw new UnsafeUrlError("BLOCKED_HOST", "That address is not publicly reachable.");
  }
  return url;
}
