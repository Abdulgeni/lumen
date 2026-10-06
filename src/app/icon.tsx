import { ImageResponse } from "next/og";

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
        border: "3px solid #C8A96A",
        borderRadius: 16,
        color: "#E6D3A3",
        fontSize: 40,
        fontWeight: 700,
      }}
    >
      L
    </div>,
    size,
  );
}
