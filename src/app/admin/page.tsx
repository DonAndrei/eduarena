import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { addDays, isDateString, openingInterval, venueDateString, venueTime } from "@/lib/slots";
import { formatDateLong, formatDuration, formatPrice, formatTime, priceFor } from "@/lib/format";
import { AdminNav } from "./AdminNav";
import { adminCancel, adminConfirm, adminUnblock } from "./actions";
import { AddBookingForm, BlockForm } from "./AdminForms";

const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmată", cls: "bg-lime/15 text-lime border-lime/30" },
  PENDING: { label: "Așteaptă email", cls: "bg-amber-300/10 text-amber-300 border-amber-300/30" },
  CANCELLED: { label: "Anulată", cls: "bg-danger/10 text-danger border-danger/30" },
  EXPIRED: { label: "Expirată", cls: "bg-line/40 text-muted border-line" },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;
  const today = venueDateString(new Date());
  const date = sp.date && isDateString(sp.date) ? sp.date : today;
  const settings = await getSettings();

  const dayStart = venueTime(date, "00:00");
  const dayEnd = venueTime(addDays(date, 1), "00:00");
  const open = openingInterval(date, settings.hours);
  const rangeEnd = open && open.end > dayEnd ? open.end : dayEnd;

  const [bookings, blocks, upcoming] = await Promise.all([
    prisma.booking.findMany({
      where: { startAt: { gte: dayStart, lt: rangeEnd } },
      orderBy: { startAt: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: { startAt: { lt: rangeEnd }, endAt: { gt: dayStart } },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { status: { in: ["CONFIRMED", "PENDING"] }, startAt: { gte: new Date(), lt: venueTime(addDays(today, 15), "00:00") } },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
  ]);

  const active = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING");
  const bookedMinutes = active.reduce((s, b) => s + (b.endAt.getTime() - b.startAt.getTime()) / 60000, 0);
  const openMinutes = open ? (open.end.getTime() - open.start.getTime()) / 60000 : 0;

  return (
    <>
      <AdminNav active="bookings" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Date nav */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{date === today ? "Azi" : "Ziua selectată"}</p>
            <h1 className="font-display text-4xl font-extrabold uppercase capitalize">{formatDateLong(dayStart, "ro")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin?date=${addDays(date, -1)}`} className="rounded-lg border border-line p-2" aria-label="Ziua anterioară"><ChevronLeft className="size-5" /></Link>
            <Link href="/admin" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Azi</Link>
            <Link href={`/admin?date=${addDays(date, 1)}`} className="rounded-lg border border-line p-2" aria-label="Ziua următoare"><ChevronRight className="size-5" /></Link>
            <form action="/admin" className="flex gap-2">
              <input type="date" name="date" defaultValue={date} className="input !py-2 !w-auto" />
              <button className="rounded-lg bg-panel-2 px-3 py-2 text-sm font-semibold">Mergi</button>
            </form>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Rezervări active" value={String(active.length)} />
          <Stat label="Ore rezervate" value={formatDuration(bookedMinutes || 0, "ro")} />
          <Stat label="Grad ocupare" value={openMinutes ? `${Math.round((bookedMinutes / openMinutes) * 100)}%` : "Închis"} />
        </div>

        {/* Day strip */}
        {open && (
          <DayStrip
            open={open}
            items={[
              ...active.map((b) => ({ start: b.startAt, end: b.endAt, kind: b.status, label: b.name })),
              ...blocks.map((b) => ({ start: b.startAt, end: b.endAt, kind: "BLOCK", label: b.reason ?? "Blocat" })),
            ]}
          />
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-8">
            <section>
              <h2 className="font-display text-2xl font-extrabold uppercase">Rezervările zilei</h2>
              {bookings.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-line bg-panel p-6 text-muted">Nicio rezervare în această zi.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {bookings.map((b) => {
                    const minutes = (b.endAt.getTime() - b.startAt.getTime()) / 60000;
                    const s = STATUS[b.status];
                    const isActive = b.status === "CONFIRMED" || b.status === "PENDING";
                    return (
                      <li key={b.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-panel p-4 ${isActive ? "" : "opacity-50"}`}>
                        <div className="w-28 shrink-0">
                          <p className="font-display text-2xl font-extrabold tabular-nums">{formatTime(b.startAt, "ro")}</p>
                          <p className="text-xs text-muted">până la {formatTime(b.endAt, "ro")}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{b.name} <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span></p>
                          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted">
                            <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 hover:text-lime"><Phone className="size-3.5" />{b.phone || "—"}</a>
                            {b.email && <span>{b.email}</span>}
                            <span>{formatDuration(minutes, "ro")} · {formatPrice(priceFor(minutes, settings.pricePerHour))}</span>
                          </p>
                          {b.note && <p className="mt-1 text-sm text-text/70">„{b.note}”</p>}
                        </div>
                        {isActive && (
                          <div className="flex gap-2">
                            {b.status === "PENDING" && (
                              <form action={adminConfirm}><input type="hidden" name="id" value={b.id} /><button className="rounded-lg border border-lime/40 px-3 py-1.5 text-sm font-semibold text-lime">Confirmă</button></form>
                            )}
                            <form action={adminCancel}><input type="hidden" name="id" value={b.id} /><button className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-semibold text-danger">Anulează</button></form>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {blocks.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-extrabold uppercase">Intervale blocate</h2>
                <ul className="mt-3 space-y-2">
                  {blocks.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-line bg-panel p-4">
                      <span><b className="tabular-nums">{formatTime(b.startAt, "ro")} – {formatTime(b.endAt, "ro")}</b> <span className="text-muted">{b.reason}</span></span>
                      <form action={adminUnblock}><input type="hidden" name="id" value={b.id} /><button className="text-sm font-semibold text-muted hover:text-text">Deblochează</button></form>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="font-display text-2xl font-extrabold uppercase">Următoarele 14 zile</h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-muted">Nimic programat.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-panel-2 text-left text-muted">
                      <tr><th className="p-3">Data</th><th className="p-3">Ora</th><th className="p-3">Nume</th><th className="p-3">Telefon</th><th className="p-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {upcoming.map((b) => (
                        <tr key={b.id} className="border-t border-line">
                          <td className="p-3"><Link className="hover:text-lime" href={`/admin?date=${venueDateString(b.startAt)}`}>{new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", weekday: "short", day: "numeric", month: "short" }).format(b.startAt)}</Link></td>
                          <td className="p-3 tabular-nums">{formatTime(b.startAt, "ro")}–{formatTime(b.endAt, "ro")}</td>
                          <td className="p-3">{b.name}</td>
                          <td className="p-3"><a href={`tel:${b.phone}`}>{b.phone}</a></td>
                          <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS[b.status].cls}`}>{STATUS[b.status].label}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <AddBookingForm date={date} />
            <BlockForm date={date} />
          </aside>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function DayStrip({
  open,
  items,
}: {
  open: { start: Date; end: Date };
  items: { start: Date; end: Date; kind: string; label: string }[];
}) {
  const total = open.end.getTime() - open.start.getTime();
  const pct = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - open.start.getTime()) / total) * 100));
  const hours: Date[] = [];
  for (let t = open.start.getTime(); t <= open.end.getTime(); t += 3600_000) hours.push(new Date(t));
  return (
    <div className="mt-6 rounded-2xl border border-line bg-panel p-4">
      <div className="relative h-14 overflow-hidden rounded-xl bg-panel-2">
        {hours.map((h) => (
          <div key={h.getTime()} className="absolute inset-y-0 border-l border-line/70" style={{ left: `${pct(h)}%` }} />
        ))}
        {items.map((it, i) => (
          <div
            key={i}
            title={`${formatTime(it.start, "ro")}–${formatTime(it.end, "ro")} ${it.label}`}
            className={`absolute inset-y-1.5 overflow-hidden rounded-lg px-2 py-1 text-xs font-bold ${
              it.kind === "CONFIRMED" ? "bg-lime text-ink" : it.kind === "PENDING" ? "bg-amber-300/80 text-ink" : "bg-[repeating-linear-gradient(45deg,#2a352d_0_6px,#1c241f_6px_12px)] text-muted"
            }`}
            style={{ left: `${pct(it.start)}%`, width: `${pct(it.end) - pct(it.start)}%` }}
          >
            <span className="block truncate">{it.label}</span>
          </div>
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-muted">
        {hours.map((h, i) => (
          <span key={h.getTime()} className={`absolute -translate-x-1/2 tabular-nums ${i % 2 ? "hidden sm:block" : ""}`} style={{ left: `${pct(h)}%` }}>
            {formatTime(h, "ro")}
          </span>
        ))}
      </div>
    </div>
  );
}
