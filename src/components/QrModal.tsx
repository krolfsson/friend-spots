"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex touch-manipulation items-end justify-center bg-indigo-950/40 p-2 backdrop-blur-[2px] sm:items-center sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-label="QR-kod"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xs overflow-hidden rounded-3xl border border-indigo-200/70 bg-white/95 shadow-2xl shadow-indigo-950/25">
        <div className="flex items-center justify-between gap-3 border-b border-indigo-100 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-indigo-950">{title}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-indigo-900/50">Scanna för att öppna kartan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg leading-none shadow-sm"
            aria-label="Stäng"
          >
            <span aria-hidden>❌</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-7">
          <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-inner shadow-indigo-50">
            <QRCodeSVG
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#312e81"
              level="M"
            />
          </div>
          <p className="max-w-[220px] break-all text-center text-[11px] font-semibold text-indigo-900/40">
            {url}
          </p>
        </div>
      </div>
    </div>
  );
}
