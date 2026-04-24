import { prisma } from "@/lib/prisma";
import { AdminPinGate } from "./AdminPinGate";
import { AdminChart } from "./AdminChart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapsies Admin" };

async function getStats() {
  const [totalRooms, totalCities, totalSpots, totalPlusses, recentSpots, rooms] =
    await Promise.all([
      prisma.room.count(),
      prisma.city.count(),
      prisma.spot.count(),
      prisma.spotPlus.count(),
      prisma.spot.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { city: { select: { name: true, room: { select: { slug: true, name: true } } } } },
      }),
      prisma.room.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { cities: true } },
          cities: {
            include: { _count: { select: { spots: true } } },
          },
        },
      }),
    ]);

  const spotsPerRoom = rooms.map((r) => ({
    slug: r.slug,
    name: r.name ?? r.slug,
    createdAt: r.createdAt,
    cities: r._count.cities,
    spots: r.cities.reduce((sum, c) => sum + c._count.spots, 0),
  }));

  const now = new Date();
  const day = new Date(now); day.setHours(0, 0, 0, 0);
  const week = new Date(now); week.setDate(now.getDate() - 7);
  const month = new Date(now); month.setDate(now.getDate() - 30);

  const [spotsToday, spotsWeek, spotsMonth, mapsToday, mapsWeek, mapsMonth] = await Promise.all([
    prisma.spot.count({ where: { createdAt: { gte: day } } }),
    prisma.spot.count({ where: { createdAt: { gte: week } } }),
    prisma.spot.count({ where: { createdAt: { gte: month } } }),
    prisma.room.count({ where: { createdAt: { gte: day } } }),
    prisma.room.count({ where: { createdAt: { gte: week } } }),
    prisma.room.count({ where: { createdAt: { gte: month } } }),
  ]);

  return { totalRooms, totalCities, totalSpots, totalPlusses, recentSpots, spotsPerRoom, spotsToday, spotsWeek, spotsMonth, mapsToday, mapsWeek, mapsMonth };
}

export default async function AdminPage() {
  const s = await getStats();

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Stockholm" }).format(d);

  return (
    <AdminPinGate>
      <div className="min-h-dvh bg-[#fdf4ff] px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-10">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-950">Mapsies Admin</h1>
            <p className="mt-1 text-sm font-medium text-indigo-900/50">Live data from the database.</p>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Maps", value: s.totalRooms },
              { label: "Cities", value: s.totalCities },
              { label: "Spots", value: s.totalSpots },
              { label: "Plusses", value: s.totalPlusses },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-[0.72rem] font-bold uppercase tracking-widest text-indigo-900/40">{c.label}</p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums text-indigo-950">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 shadow-sm">
              <p className="mb-3 text-sm font-extrabold text-indigo-950">Spots added</p>
              <div className="space-y-1 text-sm font-semibold text-indigo-900/70">
                <div className="flex justify-between"><span>Today</span><span className="tabular-nums">{s.spotsToday}</span></div>
                <div className="flex justify-between"><span>Last 7 days</span><span className="tabular-nums">{s.spotsWeek}</span></div>
                <div className="flex justify-between"><span>Last 30 days</span><span className="tabular-nums">{s.spotsMonth}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 shadow-sm">
              <p className="mb-3 text-sm font-extrabold text-indigo-950">Maps created</p>
              <div className="space-y-1 text-sm font-semibold text-indigo-900/70">
                <div className="flex justify-between"><span>Today</span><span className="tabular-nums">{s.mapsToday}</span></div>
                <div className="flex justify-between"><span>Last 7 days</span><span className="tabular-nums">{s.mapsWeek}</span></div>
                <div className="flex justify-between"><span>Last 30 days</span><span className="tabular-nums">{s.mapsMonth}</span></div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <AdminChart />

          {/* All maps table */}
          <div className="rounded-2xl border border-indigo-100 bg-white/80 shadow-sm">
            <div className="border-b border-indigo-100 px-5 py-3">
              <p className="text-sm font-extrabold text-indigo-950">All maps ({s.totalRooms})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-indigo-100 text-left text-[0.7rem] font-bold uppercase tracking-widest text-indigo-900/40">
                    <th className="px-5 py-2">Name / slug</th>
                    <th className="px-5 py-2 text-right">Cities</th>
                    <th className="px-5 py-2 text-right">Spots</th>
                    <th className="px-5 py-2 text-right">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {s.spotsPerRoom.sort((a, b) => b.spots - a.spots).map((r) => (
                    <tr key={r.slug} className="border-b border-indigo-50 last:border-0 hover:bg-indigo-50/40">
                      <td className="px-5 py-2.5">
                        <span className="font-extrabold text-indigo-950">{r.name}</span>
                        <span className="ml-2 text-xs text-indigo-900/40">/{r.slug}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-indigo-900/70">{r.cities}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums font-bold text-indigo-950">{r.spots}</td>
                      <td className="px-5 py-2.5 text-right text-xs text-indigo-900/40">{fmt(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent spots */}
          <div className="rounded-2xl border border-indigo-100 bg-white/80 shadow-sm">
            <div className="border-b border-indigo-100 px-5 py-3">
              <p className="text-sm font-extrabold text-indigo-950">10 latest spots</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-indigo-100 text-left text-[0.7rem] font-bold uppercase tracking-widest text-indigo-900/40">
                    <th className="px-5 py-2">Spot</th>
                    <th className="px-5 py-2">City</th>
                    <th className="px-5 py-2">Map</th>
                    <th className="px-5 py-2 text-right">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentSpots.map((spot) => (
                    <tr key={spot.id} className="border-b border-indigo-50 last:border-0 hover:bg-indigo-50/40">
                      <td className="px-5 py-2.5 font-semibold text-indigo-950">{spot.name}</td>
                      <td className="px-5 py-2.5 text-indigo-900/60">{spot.city.name}</td>
                      <td className="px-5 py-2.5 text-xs text-indigo-900/40">
                        {spot.city.room.name ?? spot.city.room.slug}
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-indigo-900/40">{fmt(spot.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AdminPinGate>
  );
}
