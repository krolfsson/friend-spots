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
          padding: 56,
          background: "linear-gradient(160deg, #fdf4ff 0%, #e9d5ff 45%, #fbcfe8 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Emoji collage */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.95 }}>
          {[
            ["🗺️", 70, 60, -12, 78],
            ["📍", 120, 980, 18, 72],
            ["🥐", 420, 64, 8, 70],
            ["🍜", 70, 1060, -10, 74],
            ["🍱", 485, 1040, 12, 74],
            ["🧋", 520, 120, -8, 78],
            ["🛍️", 330, 930, -6, 76],
            ["🏨", 120, 420, 10, 80],
            ["🗼", 420, 1090, -14, 76],
            ["🍹", 520, 950, 8, 74],
            ["✨", 80, 660, 10, 62],
            ["🌆", 470, 610, -6, 74],
          ].map(([e, top, left, rot, size], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top,
                left,
                fontSize: size,
                transform: `rotate(${rot}deg)`,
                filter: "drop-shadow(0 12px 30px rgba(99,102,241,0.10))",
                opacity: 0.75,
              }}
            >
              {e}
            </div>
          ))}
        </div>

        {/* Glass card */}
        <div
          style={{
            width: 1020,
            borderRadius: 48,
            background: "linear-gradient(155deg, rgba(255,255,255,0.82), rgba(255,255,255,0.48))",
            border: "2px solid rgba(255,255,255,0.78)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.85) inset, 0 28px 70px rgba(99,102,241,0.18)",
            padding: 52,
            display: "flex",
            alignItems: "center",
            gap: 34,
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 56,
              background: "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.42))",
              border: "2px solid rgba(255,255,255,0.75)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.75) inset, 0 22px 60px rgba(236,72,153,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 140,
                fontWeight: 900,
                letterSpacing: "-0.06em",
                lineHeight: 1,
                background: "linear-gradient(90deg, #ec4899, #8b5cf6 55%, #38bdf8)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                textShadow: "0 18px 44px rgba(236,72,153,0.22)",
                transform: "translateY(-4px)",
              }}
            >
              M
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                background: "linear-gradient(90deg, #ec4899, #8b5cf6 55%, #38bdf8)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                textShadow: "0 18px 44px rgba(236,72,153,0.18)",
              }}
            >
              {SITE_TITLE}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: "#1e1b4b",
                opacity: 0.8,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              Share a link. Add your favorite places. Vote with +1.
            </div>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {["🗺️ Map-first", "📍 Tips", "🙋 +1 votes", "🔒 PIN unlock"].map((chip, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.58))",
                    border: "1.5px solid rgba(199,210,254,0.55)",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset",
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#1e1b4b",
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
