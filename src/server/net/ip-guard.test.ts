import { describe, expect, it } from "vitest";
import { isBlockedAddress, parseFetchableUrl, UnsafeUrlError } from "./ip-guard";

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:a9fe:a9fe",
    "64:ff9b::7f00:1",
    "not-an-ip",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111"])(
    "allows %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});

describe("parseFetchableUrl", () => {
  it.each([
    "",
    "not a url",
    "ftp://example.com/file",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "http://user:pass@example.com/",
    "http://localhost/",
    "http://localhost./",
    "http://app.localhost/",
    "http://printer.local/",
    "http://db.internal/",
    "http://intranet/",
    "http://127.0.0.1/",
    "http://0x7f.1/",
    "http://2130706433/",
    "http://[::1]/",
    "http://169.254.169.254/latest/meta-data/",
    "https://example.com:8443/",
  ])("rejects %j", (input) => {
    expect(() => parseFetchableUrl(input)).toThrow(UnsafeUrlError);
  });

  it("accepts ordinary public links", () => {
    expect(parseFetchableUrl("https://example.com/path?q=1").hostname).toBe("example.com");
    expect(parseFetchableUrl("http://example.com:80/").hostname).toBe("example.com");
  });

  it("rejects over-long links", () => {
    expect(() => parseFetchableUrl(`https://example.com/${"a".repeat(3000)}`)).toThrow(
      UnsafeUrlError,
    );
  });
});
