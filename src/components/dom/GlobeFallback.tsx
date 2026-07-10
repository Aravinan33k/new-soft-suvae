// Static, on-brand stand-in for the live globe — a CSS-only night-Earth disc
// with a warm sunrise rim. Pulls double duty:
//  1. HeroGlobe paints it at first load as the placeholder the live globe
//     cross-fades over, so the hero never shows an empty column while the
//     three.js scene initializes off-screen.
//  2. GlobeScene swaps it in when WebGL is unavailable or the browser drops
//     the GL context and never restores it (common when several heavy 3D
//     pages/tabs exhaust the per-process context cap — a lost context paints
//     transparent in Chrome but *white* in Edge). The hero degrades
//     gracefully instead of showing a dead rectangle.
export default function GlobeFallback() {
  return (
    <div aria-hidden className="absolute inset-0 grid place-items-center">
      {/* soft atmospheric back-glow */}
      <div
        className="absolute aspect-square w-[86%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 62% 34%, rgba(255,150,70,0.16), transparent 62%)",
        }}
      />
      {/* the planet disc: dark navy night side, sunrise on the upper-right limb */}
      <div
        className="relative aspect-square w-[76%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 62% 32%, #16233f 0%, #0c1428 46%, #070c1a 72%, #04060f 100%)",
          boxShadow:
            "inset -22px -26px 60px rgba(0,0,0,0.72), inset 30px 26px 70px rgba(255,150,70,0.05)",
        }}
      >
        {/* warm sunrise crescent hugging the upper-right rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 80% 22%, rgba(255,158,74,0.42), rgba(255,158,74,0) 44%)",
            mixBlendMode: "screen",
          }}
        />
        {/* thin bright air-line on the silhouette edge */}
        <div
          className="absolute -inset-px rounded-full"
          style={{ boxShadow: "0 0 34px 1px rgba(255,164,84,0.14)" }}
        />
      </div>
    </div>
  );
}
