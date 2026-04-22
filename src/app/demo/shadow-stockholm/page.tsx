import type { Metadata } from "next";
import { ShadowStockholmClient } from "./ShadowStockholmClient";

export const metadata: Metadata = {
  title: "Stockholm skugga (demo)",
  description: "MapLibre 3D-byggnader + sol/skugga-prototyp för Stockholm.",
  robots: { index: false, follow: false },
};

export default function ShadowStockholmDemoPage() {
  return <ShadowStockholmClient />;
}
