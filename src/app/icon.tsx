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
            background: "linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,255,255,0.45))",
            border: "1.5px solid rgba(255,255,255,0.78)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.75) inset, 0 10px 24px rgba(99,102,241,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 32 32" aria-hidden>
            <defs>
              <linearGradient id="m" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="55%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1.0" stdDeviation="0.9" floodColor="#ec4899" floodOpacity="0.22" />
              </filter>
            </defs>
            <path
              d="M7.9 24.6V7.9h4.1l4.0 7.3 4.1-7.3h4.0v16.7h-3.8V14.1l-3.2 5.8h-2.2l-3.2-5.8v10.5H7.9Z"
              fill="url(#m)"
              filter="url(#shadow)"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}

