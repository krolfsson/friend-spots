import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #fdf4ff 0%, #e9d5ff 40%, #fbcfe8 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 140, lineHeight: 1, marginBottom: 24 }}>🗺️</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#1e1b4b",
            letterSpacing: "-0.02em",
          }}
        >
          Tips
        </div>
      </div>
    ),
    { ...size },
  );
}
