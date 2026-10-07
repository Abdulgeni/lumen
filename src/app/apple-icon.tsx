import { ImageResponse } from "next/og";
import { MARK_PATHS } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0B",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="92"
        height="142"
        viewBox="0 0 130 200"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={MARK_PATHS.upperFill} fill="#C8A96A" fillOpacity="0.1" />
        <path d={MARK_PATHS.outerUpper} stroke="#E6D3A3" strokeWidth="5" />
        <path d={MARK_PATHS.outerLower} stroke="#C8A96A" strokeOpacity="0.6" strokeWidth="5" />
        <path d={MARK_PATHS.equator} stroke="#C8A96A" strokeOpacity="0.55" strokeWidth="4" />
        <path d={MARK_PATHS.innerUpper} stroke="#C8A96A" strokeOpacity="0.7" strokeWidth="4" />
        <path d={MARK_PATHS.innerLower} stroke="#C8A96A" strokeOpacity="0.45" strokeWidth="4" />
      </svg>
    </div>,
    size,
  );
}
