"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "#0A0A0B",
          color: "#F5F1E8",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 300,
            fontSize: "2.25rem",
            margin: 0,
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "#A8A398", margin: 0 }}>
          Please try again. If it keeps happening, quote the reference below to support.
        </p>
        {error.digest ? (
          <code style={{ color: "#A8A398", fontSize: "12px" }}>Reference: {error.digest}</code>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#C8A96A",
            color: "#0A0A0B",
            border: 0,
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
