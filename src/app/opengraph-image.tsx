import { ImageResponse } from "next/og";
import { MARK_PATHS } from "@/lib/brand";

export const alt = "Lumen: every long read, distilled to what matters";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "radial-gradient(circle at 78% 18%, rgba(200,169,106,0.28), #0A0A0B 58%)",
        color: "#F5F1E8",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="46"
          height="71"
          viewBox="0 0 130 200"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={MARK_PATHS.outerUpper} stroke="#E6D3A3" strokeWidth="5" />
          <path d={MARK_PATHS.outerLower} stroke="#C8A96A" strokeOpacity="0.6" strokeWidth="5" />
          <path d={MARK_PATHS.equator} stroke="#C8A96A" strokeOpacity="0.55" strokeWidth="4" />
          <path d={MARK_PATHS.innerUpper} stroke="#C8A96A" strokeOpacity="0.7" strokeWidth="4" />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            letterSpacing: 14,
            color: "#C8A96A",
            marginLeft: 28,
          }}
        >
          LUMEN
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 82,
          lineHeight: 1.08,
          fontWeight: 600,
          maxWidth: 940,
        }}
      >
        Every long read, distilled to what matters.
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#A8A398", marginTop: 36 }}>
        AI summaries in the shape, tone, and language you choose.
      </div>
    </div>,
    size,
  );
}
