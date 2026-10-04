/** An error with an HTTP status and a machine-readable code, safe to show to the user. */
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiFailure";
  }
}
