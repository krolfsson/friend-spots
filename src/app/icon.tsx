import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -14,
            background:
              "radial-gradient(28px 28px at 20% 25%, rgba(236,72,153,0.20), transparent 55%), radial-gradient(30px 30px at 85% 30%, rgba(56,189,248,0.20), transparent 55%), radial-gradient(40px 40px at 45% 85%, rgba(139,92,246,0.18), transparent 60%)",
            transform: "rotate(-8deg)",
          }}
        />
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: "linear-gradient(145deg, rgba(255,255,255,0.80), rgba(255,255,255,0.42))",
            border: "1.5px solid rgba(255,255,255,0.78)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset, 0 10px 24px rgba(99,102,241,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              fontSize: 44,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.08em",
              background: "linear-gradient(90deg, #ec4899, #8b5cf6 55%, #38bdf8)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 10px 22px rgba(236,72,153,0.22)",
              transform: "translateY(-1px)",
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

