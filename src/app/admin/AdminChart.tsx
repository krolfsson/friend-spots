"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Row = { date: string; maps: number; cities: number; spots: number; plusses: number };
type Days = 1 | 7 | 30 | 365;
type Metric = "maps" | "cities" | "spots" | "plusses";

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: "maps",    label: "Maps",    color: "#6d28d9" },
  { key: "cities",  label: "Cities",  color: "#0ea5e9" },
  { key: "spots",   label: "Spots",   color: "#10b981" },
  { key: "plusses", label: "Plusses", color: "#f59e0b" },
];

const DAY_OPTIONS: Days[] = [1, 7, 30, 365];

function fmtDate(date: string, days: Days) {
  const d = new Date(date);
  if (days === 1)   return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  if (days <= 30)   return d.toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
  return d.toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
}

export function AdminChart() {
  const [days, setDays] = useState<Days>(30);
  const [active, setActive] = useState<Set<Metric>>(new Set(["maps", "spots"]));
  const [cumulative, setCumulative] = useState(false);
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/admin/chart?days=${days}`)
      .then((r) => r.json())
      .then((d: Row[]) => { setData(d); setLoading(false); });
  }, [days]);

  function toggle(key: Metric) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }

  const displayData = (() => {
    if (!cumulative) return data;
    const acc = { maps: 0, cities: 0, spots: 0, plusses: 0 };
    return data.map((r) => {
      acc.maps    += r.maps;
      acc.cities  += r.cities;
      acc.spots   += r.spots;
      acc.plusses += r.plusses;
      return { ...r, ...acc };
    });
  })();

  const formatted = displayData.map((r) => ({ ...r, date: fmtDate(r.date, days) }));

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/80 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-extrabold text-indigo-950">Activity over time</p>
          {/* Cumulative toggle */}
          <button
            onClick={() => setCumulative((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs font-extrabold transition ${
              cumulative
                ? "bg-violet-600 text-white"
                : "bg-indigo-50 text-indigo-900/60 hover:bg-indigo-100"
            }`}
          >
            {cumulative ? "Total" : "Per day"}
          </button>
        </div>

        {/* Day range toggle */}
        <div className="flex gap-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 text-xs font-extrabold transition ${
                days === d
                  ? "bg-indigo-800 text-white"
                  : "bg-indigo-50 text-indigo-900/60 hover:bg-indigo-100"
              }`}
            >
              {d === 1 ? "Today" : d === 365 ? "1y" : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 px-5 pt-4">
        {METRICS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold transition ${
              active.has(key)
                ? "border-transparent text-white"
                : "border-indigo-100 bg-white text-indigo-900/40"
            }`}
            style={active.has(key) ? { backgroundColor: color, borderColor: color } : {}}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: active.has(key) ? "rgba(255,255,255,0.7)" : color }}
            />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 pb-4 pt-4">
        {loading ? (
          <div className="flex h-52 items-center justify-center text-sm font-semibold text-indigo-900/40">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={formatted} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6366f1", fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6366f1", fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e0e7ff",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 4px 24px rgba(99,102,241,0.10)",
                }}
              />
              {METRICS.filter(({ key }) => active.has(key)).map(({ key, label, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
