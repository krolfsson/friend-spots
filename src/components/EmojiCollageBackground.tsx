/** Mjuk gradientbakgrund för landningssidan (inga dekor-emojis — snabbare paint). */
export function EmojiCollageBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-50 via-white to-sky-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-15%,rgba(233,213,255,0.55),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_100%_20%,rgba(251,207,232,0.35),transparent_50%)]" />
    </div>
  );
}
