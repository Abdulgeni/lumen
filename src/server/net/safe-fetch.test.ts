import { describe, expect, it } from "vitest";
import {
  decodeBody,
  type FetchLike,
  guardedLookup,
  type ResponseLike,
  safeFetch,
} from "./safe-fetch";

function response(status: number, headers: Record<string, string> = {}, body = ""): ResponseLike {
  const bytes = new TextEncoder().encode(body);
  return {
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
  };
}

function scripted(...responses: ResponseLike[]) {
  const urls: string[] = [];
  const fetchImpl: FetchLike = async (url) => {
    urls.push(url);
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    return next;
  };
  return { fetchImpl, urls };
}

const html = { "content-type": "text/html; charset=utf-8" };

describe("safeFetch", () => {
  it("returns the body of a normal page", async () => {
    const { fetchImpl } = scripted(response(200, html, "<p>hello</p>"));
    const result = await safeFetch("https://example.com/", { fetchImpl });
    expect(new TextDecoder().decode(result.bytes)).toBe("<p>hello</p>");
  });

  it("follows redirects and reports the final URL", async () => {
    const { fetchImpl } = scripted(
      response(302, { location: "/final" }),
      response(200, html, "ok"),
    );
    const result = await safeFetch("https://example.com/start", { fetchImpl });
    expect(result.url).toBe("https://example.com/final");
  });

  it("blocks a redirect to the cloud metadata address without requesting it", async () => {
    const { fetchImpl, urls } = scripted(
      response(302, { location: "http://169.254.169.254/latest/meta-data/" }),
    );
    await expect(safeFetch("https://example.com/", { fetchImpl })).rejects.toMatchObject({
      code: "BLOCKED_HOST",
    });
    expect(urls).toHaveLength(1);
  });

  it("blocks a redirect to localhost", async () => {
    const { fetchImpl } = scripted(response(301, { location: "http://localhost:3000/admin" }));
    await expect(safeFetch("https://example.com/", { fetchImpl })).rejects.toMatchObject({
      code: "BLOCKED_HOST",
    });
  });

  it("stops redirect loops", async () => {
    const loop = Array.from({ length: 10 }, () =>
      response(302, { location: "https://example.com/next" }),
    );
    const { fetchImpl } = scripted(...loop);
    await expect(safeFetch("https://example.com/", { fetchImpl })).rejects.toMatchObject({
      code: "TOO_MANY_REDIRECTS",
    });
  });

  it("rejects unsupported content types", async () => {
    const { fetchImpl } = scripted(response(200, { "content-type": "application/pdf" }, "%PDF"));
    await expect(safeFetch("https://example.com/a.pdf", { fetchImpl })).rejects.toMatchObject({
      code: "UNSUPPORTED_CONTENT",
    });
  });

  it("rejects oversized pages by declared length", async () => {
    const { fetchImpl } = scripted(response(200, { ...html, "content-length": "999999" }, "x"));
    await expect(
      safeFetch("https://example.com/", { fetchImpl, maxBytes: 1000 }),
    ).rejects.toMatchObject({
      code: "TOO_LARGE",
    });
  });

  it("rejects oversized pages that lie about or omit their length", async () => {
    const { fetchImpl } = scripted(response(200, html, "x".repeat(5000)));
    await expect(
      safeFetch("https://example.com/", { fetchImpl, maxBytes: 1000 }),
    ).rejects.toMatchObject({
      code: "TOO_LARGE",
    });
  });

  it("reports HTTP errors", async () => {
    const { fetchImpl } = scripted(response(404, html, "nope"));
    await expect(safeFetch("https://example.com/", { fetchImpl })).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 404,
    });
  });

  it("refuses unsafe links before any request is made", async () => {
    const { fetchImpl, urls } = scripted();
    await expect(safeFetch("http://127.0.0.1/", { fetchImpl })).rejects.toMatchObject({
      code: "BLOCKED_HOST",
    });
    expect(urls).toHaveLength(0);
  });
});

describe("guardedLookup", () => {
  it("refuses hostnames that resolve to loopback", async () => {
    const error = await new Promise<NodeJS.ErrnoException | null>((resolve) => {
      guardedLookup("localhost", {}, (err) => resolve(err));
    });
    expect(error?.code).toBe("EBLOCKED");
  });
});

describe("decodeBody", () => {
  it("honours the declared charset", () => {
    expect(
      decodeBody(new Uint8Array([0x63, 0x61, 0x66, 0xe9]), "text/html; charset=iso-8859-1"),
    ).toBe("café");
  });
  it("falls back to a meta charset, then UTF-8", () => {
    const bytes = new TextEncoder().encode("<meta charset=utf-8>héllo");
    expect(decodeBody(bytes, "text/html")).toContain("héllo");
  });
});
