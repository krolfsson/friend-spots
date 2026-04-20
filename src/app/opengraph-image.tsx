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

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(900px 520px at 10% 0%, rgba(233,213,255,0.85), transparent 55%), radial-gradient(820px 520px at 95% 10%, rgba(251,207,232,0.78), transparent 52%), radial-gradient(760px 520px at 55% 100%, rgba(167,243,208,0.42), transparent 58%)",
            opacity: 0.9,
          }}
        />

        {/* Glass card (no backdropFilter; iMessage-friendly) */}
        <div
          style={{
            width: 1020,
            borderRadius: 48,
            background: "linear-gradient(155deg, rgba(255,255,255,0.88), rgba(255,255,255,0.62))",
            border: "2px solid rgba(255,255,255,0.86)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, 0 28px 70px rgba(99,102,241,0.16)",
            padding: 52,
            display: "flex",
            alignItems: "center",
            gap: 34,
          }}
        >
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 56,
              background: "linear-gradient(145deg, rgba(255,255,255,0.86), rgba(255,255,255,0.62))",
              border: "2px solid rgba(255,255,255,0.88)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.82) inset, 0 22px 60px rgba(236,72,153,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 132,
                fontWeight: 900,
                letterSpacing: "-0.06em",
                lineHeight: 1,
                color: "#1e1b4b",
                textShadow:
                  "0 18px 44px rgba(236,72,153,0.18), 0 2px 0 rgba(255,255,255,0.65)",
                transform: "translateY(-3px)",
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
                color: "#1e1b4b",
                textShadow: "0 18px 44px rgba(236,72,153,0.14)",
              }}
            >
              {SITE_TITLE}
            </div>
            <div
              style={{
                fontSize: 46,
                fontWeight: 900,
                color: "#1e1b4b",
                opacity: 0.88,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              Skapa en karta med kompisgänget
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
              {[
                "🗺️ Kartläge först",
                "📍 Tips",
                "🙋 +1",
                "🔒 Pinkod",
              ].map((chip, i) => (
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

            {/* Small "teaser" of the UI */}
            <div
              style={{
                marginTop: 18,
                width: 730,
                height: 118,
                borderRadius: 32,
                background: "linear-gradient(160deg, rgba(255,255,255,0.88), rgba(255,255,255,0.55))",
                border: "1.5px solid rgba(199,210,254,0.55)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "14px 16px",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {["🌃 Köpenhamn", "✨ Alla kategorier", "🗺️ Karta"].map((pill, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      background: i === 0 ? "linear-gradient(135deg,#a855f7,#ec4899)" : "rgba(255,255,255,0.75)",
                      border: "1.5px solid rgba(199,210,254,0.55)",
                      color: i === 0 ? "#fff" : "#1e1b4b",
                      fontSize: 18,
                      fontWeight: 900,
                      boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset",
                    }}
                  >
                    {pill}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    flex: 1,
                    height: 18,
                    borderRadius: 999,
                    background: "linear-gradient(90deg, rgba(99,102,241,0.16), rgba(236,72,153,0.14))",
                  }}
                />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#34d399,#10b981)",
                    border: "2px solid rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 28,
                    lineHeight: 1,
                    boxShadow: "0 18px 44px rgba(16,185,129,0.25)",
                  }}
                >
                  +
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
