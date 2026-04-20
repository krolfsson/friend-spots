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
          background: "linear-gradient(160deg, #fdf4ff 0%, #e9d5ff 45%, #fbcfe8 100%)",
          borderRadius: 36,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -40,
            background:
              "radial-gradient(80px 80px at 15% 20%, rgba(236,72,153,0.18), transparent 55%), radial-gradient(90px 90px at 85% 25%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(120px 120px at 45% 85%, rgba(139,92,246,0.16), transparent 60%)",
            transform: "rotate(-8deg)",
          }}
        />
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 40,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.42))",
            border: "2px solid rgba(255,255,255,0.75)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.75) inset, 0 18px 44px rgba(99,102,241,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              fontSize: 104,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              background: "linear-gradient(90deg, #ec4899, #8b5cf6 55%, #38bdf8)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 12px 30px rgba(236,72,153,0.22)",
              transform: "translateY(-2px)",
              fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
            }}
          >
            M
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
