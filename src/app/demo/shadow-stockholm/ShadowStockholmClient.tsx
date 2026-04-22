"use client";

import dynamic from "next/dynamic";

const StockholmShadowDemo = dynamic(
  () => import("@/components/demo/StockholmShadowDemo").then((m) => m.StockholmShadowDemo),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-indigo-950 text-sm font-bold text-indigo-100">
        Laddar demo…
      </div>
    ),
  },
);

export function ShadowStockholmClient() {
  return <StockholmShadowDemo />;
}
