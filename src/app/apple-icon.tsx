import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 100,
          lineHeight: 1,
          background: "linear-gradient(135deg, #e9d5ff, #fbcfe8)",
          borderRadius: 36,
        }}
      >
        🗺️
      </div>
    ),
    { ...size },
  );
}
