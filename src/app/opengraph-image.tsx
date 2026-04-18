import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_TITLE;
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
          padding: 48,
          background: "linear-gradient(160deg, #fdf4ff 0%, #e9d5ff 40%, #fbcfe8 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 120, lineHeight: 1, marginBottom: 28 }}>🗺️</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 8,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: "#1e1b4b",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Dina och dina vänners
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#1e1b4b",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            bästa tips
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
