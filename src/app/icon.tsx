import { ImageResponse } from "next/og";
import { MARK_PATHS } from "@/lib/brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0B",
        borderRadius: 14,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="34"
        height="52"
        viewBox="0 0 130 200"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={MARK_PATHS.upperFill} fill="#C8A96A" fillOpacity="0.14" />
        <path d={MARK_PATHS.outerUpper} stroke="#E6D3A3" strokeWidth="10" />
        <path d={MARK_PATHS.outerLower} stroke="#C8A96A" strokeOpacity="0.75" strokeWidth="10" />
        <path d={MARK_PATHS.equator} stroke="#C8A96A" strokeOpacity="0.7" strokeWidth="7" />
        <path d={MARK_PATHS.innerUpper} stroke="#C8A96A" strokeOpacity="0.85" strokeWidth="8" />
      </svg>
    </div>,
    size,
  );
}
