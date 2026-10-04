import { z } from "zod";
import { env } from "../../env";
import { auth } from "../auth";
import { ApiFailure } from "./failure";

export { ApiFailure };

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, { ...init, headers: { ...NO_STORE, ...init.headers } });
}

export function failureResponse(error: unknown): Response {
  if (error instanceof ApiFailure) {
    const headers: Record<string, string> = {};
    const retry = error.extra.retryAfterSeconds;
    if (typeof retry === "number") headers["Retry-After"] = String(retry);
    return jsonResponse(
      { error: { code: error.code, message: error.message, ...error.extra } },
      { status: error.status, headers },
    );
  }
  console.error("[api] unexpected error:", error instanceof Error ? error.name : "unknown");
  return jsonResponse(
    { error: { code: "INTERNAL", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

/** Defense in depth on top of SameSite cookies: state-changing requests must come from our own origin. */
export function assertSameOrigin(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  const allowed = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  const origin = request.headers.get("origin");
  const crossSite = origin
    ? origin !== allowed
    : request.headers.get("sec-fetch-site") === "cross-site";
  if (crossSite) throw new ApiFailure(403, "BAD_ORIGIN", "Cross-origin requests are not allowed.");
}

/** Always validates against the database, never trusting the cookie alone. */
export async function requireApiSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new ApiFailure(401, "UNAUTHENTICATED", "Sign in to continue.");
  return session;
}

export function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiFailure(400, "INVALID_REQUEST", "Some fields are invalid.", {
      fields: z.flattenError(result.error).fieldErrors,
    });
  }
  return result.data;
}

/** Wraps a route handler with the origin check and uniform error responses. */
export function handle<Ctx = unknown>(handler: (request: Request, ctx: Ctx) => Promise<Response>) {
  return async (request: Request, ctx: Ctx): Promise<Response> => {
    try {
      assertSameOrigin(request);
      return await handler(request, ctx);
    } catch (error) {
      return failureResponse(error);
    }
  };
}

/** Streams events as newline-delimited JSON, and stops the work if the client disconnects. */
export function ndjsonResponse(events: AsyncGenerator<object>, onCancel: () => void): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch (error) {
        console.error("[api] stream failed:", error instanceof Error ? error.name : "unknown");
        controller.close();
      }
    },
    async cancel() {
      onCancel();
      await events.return(undefined);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
