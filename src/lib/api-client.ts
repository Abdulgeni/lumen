export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string; details: Record<string, unknown> };

type ErrorBody = { error?: { code?: string; message?: string; [key: string]: unknown } };

export async function apiRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const hasJsonBody = init.body !== undefined && !(init.body instanceof FormData);
    const response = await fetch(path, {
      ...init,
      headers: { ...(hasJsonBody ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
    const body = (await response.json().catch(() => null)) as (T & ErrorBody) | null;
    if (!response.ok) {
      const { code, message, ...details } = body?.error ?? {};
      return {
        ok: false,
        status: response.status,
        code: code ?? "UNKNOWN",
        message: message ?? "Something went wrong. Please try again.",
        details,
      };
    }
    return { ok: true, data: body as T };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK",
      message: "You appear to be offline. Please try again.",
      details: {},
    };
  }
}
