"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Clock, Hourglass, Loader2, MailCheck } from "lucide-react";
import { addDays, durationOptions, weekday } from "@/lib/slots";
import { formatDuration, formatPrice, priceFor } from "@/lib/format";
import type { DayAvailability } from "@/lib/booking";
import { Turnstile } from "@/components/Turnstile";
import { submitBooking } from "./actions";

type Props = {
  locale: "ro" | "en";
  firstDate: string;
  lastDate: string;
  closedWeekdays: number[];
  pricePerHour: number;
  holdMinutes: number;
};

const intl = (l: string) => (l === "ro" ? "ro-RO" : "en-GB");
const asUTC = (d: string) => new Date(`${d}T12:00:00Z`);

function addMinutesLabel(label: string, minutes: number) {
  const [h, m] = label.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function BookingForm({ locale, firstDate, lastDate, closedWeekdays, pricePerHour, holdMinutes }: Props) {
  const t = useTranslations("book");

  const dates = useMemo(() => {
    const out: string[] = [];
    for (let d = firstDate; d <= lastDate; d = addDays(d, 1)) out.push(d);
    return out;
  }, [firstDate, lastDate]);

  const [date, setDate] = useState(firstDate);
  const [day, setDay] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "", website: "" });
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/availability?date=${d}`, { cache: "no-store" });
      setDay(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStart(null);
    setDay(null);
    load(date);
  }, [date, load]);

  // Late in the day there may be nothing left today: jump to tomorrow once, automatically.
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  useEffect(() => {
    if (!autoAdvanced && day && day.date === firstDate && !day.slots.some((s) => s.maxDuration > 0)) {
      setAutoAdvanced(true);
      if (dates[1]) setDate(dates[1]);
    }
  }, [day, autoAdvanced, firstDate, dates]);

  const slot = day?.slots.find((s) => s.start === start) ?? null;
  const options = slot ? durationOptions(slot.maxDuration) : [];
  const freeCount = day?.slots.filter((s) => s.maxDuration > 0).length ?? 0;

  useEffect(() => {
    if (slot && duration > slot.maxDuration) setDuration(60);
  }, [slot, duration]);

  const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intl(locale), { ...opts, timeZone: "UTC" }).format(asUTC(d));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setSubmitting(true);
    setError(null);
    const res = await submitBooking({
      ...form,
      date,
      start: slot.start,
      duration,
      locale,
      turnstileToken: captcha,
    }).catch(() => ({ ok: false as const, error: "UNKNOWN" as const }));
    setSubmitting(false);
    if (res.ok) {
      setDone(form.email);
      return;
    }
    setError(t(`errors.${res.error}`));
    setCaptchaKey((k) => k + 1);
    setCaptcha("");
    if (res.error === "SLOT_TAKEN") {
      setStart(null);
      load(date);
    }
  }

  if (done) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-lime/40 bg-panel p-8 text-center">
        <MailCheck className="mx-auto size-14 text-lime" />
        <h2 className="mt-4 font-display text-4xl font-extrabold uppercase">{t("successTitle")}</h2>
        <p className="mt-4 text-text/80">{t("successText", { email: done, minutes: holdMinutes })}</p>
        <button
          onClick={() => {
            setDone(null);
            setStart(null);
            setForm((f) => ({ ...f, note: "" }));
            load(date);
          }}
          className="mt-8 rounded-full border border-line px-6 py-3 font-bold hover:border-text/40"
        >
          {t("successAgain")}
        </button>
      </div>
    );
  }

  const endLabel = slot ? addMinutesLabel(slot.label, duration) : null;
  const price = priceFor(duration, pricePerHour);

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-10">
        {/* Step 1: day */}
        <section>
          <StepTitle n={1} icon={<CalendarDays className="size-4" />}>{t("step1")}</StepTitle>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
            {dates.map((d, i) => {
              const closed = closedWeekdays.includes(weekday(d));
              const active = d === date;
              const top = i === 0 ? t("today") : i === 1 ? t("tomorrow") : fmtDay(d, { weekday: "short" });
              return (
                <button
                  type="button"
                  key={d}
                  disabled={closed}
                  onClick={() => setDate(d)}
                  aria-pressed={active}
                  className={`flex w-[72px] shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-3 transition ${
                    active
                      ? "border-lime bg-lime text-ink"
                      : closed
                        ? "cursor-not-allowed border-line/50 text-muted/40"
                        : "border-line bg-panel hover:border-lime/60"
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase ${active ? "" : "text-muted"}`}>{top}</span>
                  <span className="font-display text-3xl font-extrabold leading-tight">{fmtDay(d, { day: "numeric" })}</span>
                  <span className={`text-[11px] font-semibold uppercase ${active ? "" : "text-muted"}`}>
                    {fmtDay(d, { month: "short" }).replace(".", "")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: start time */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StepTitle n={2} icon={<Clock className="size-4" />}>{t("step2")}</StepTitle>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-line bg-panel-2" />{t("legendFree")}</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-line/40" />{t("legendTaken")}</span>
            </div>
          </div>
          <p className="mt-1 text-sm capitalize text-muted">{fmtDay(date, { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="mt-4">
            {loading || !day ? (
              <div className="flex items-center gap-2 py-8 text-muted">
                <Loader2 className="size-5 animate-spin" /> {t("loading")}
              </div>
            ) : !day.open ? (
              <p className="rounded-2xl border border-line bg-panel p-6 text-muted">{t("closed")}</p>
            ) : freeCount === 0 ? (
              <p className="rounded-2xl border border-line bg-panel p-6 text-muted">{t("noSlots")}</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {day.slots.map((s) => {
                  const free = s.maxDuration > 0;
                  const active = s.start === start;
                  return (
                    <button
                      type="button"
                      key={s.start}
                      disabled={!free}
                      onClick={() => setStart(s.start)}
                      aria-pressed={active}
                      className={`rounded-xl border py-3 text-sm font-bold tabular-nums transition ${
                        active
                          ? "border-lime bg-lime text-ink"
                          : free
                            ? "border-line bg-panel-2 hover:border-lime/60"
                            : "cursor-not-allowed border-transparent bg-line/30 text-muted/50 line-through"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Step 3: duration */}
        <section>
          <StepTitle n={3} icon={<Hourglass className="size-4" />}>{t("step3")}</StepTitle>
          {!slot ? (
            <p className="mt-4 text-sm text-muted">{t("pickTimeFirst")}</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {options.map((d) => {
                const active = d === duration;
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDuration(d)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active ? "border-lime bg-lime text-ink" : "border-line bg-panel-2 hover:border-lime/60"
                    }`}
                  >
                    <span className="block font-display text-2xl font-extrabold">{formatDuration(d, locale)}</span>
                    <span className={`block text-xs font-semibold ${active ? "" : "text-muted"}`}>
                      {t("until", { time: addMinutesLabel(slot.label, d) })} · {formatPrice(priceFor(d, pricePerHour))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 4: details */}
        <section>
          <StepTitle n={4}>{t("step4")}</StepTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t("name")}>
              <input required minLength={2} maxLength={80} autoComplete="name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label={t("phone")}>
              <input required type="tel" autoComplete="tel" inputMode="tel" placeholder="07xx xxx xxx" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </Field>
            <Field label={t("email")} hint={t("emailHint")} className="sm:col-span-2">
              <input required type="email" autoComplete="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </Field>
            <Field label={t("note")} className="sm:col-span-2">
              <textarea rows={2} maxLength={500} placeholder={t("notePlaceholder")} value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} className="input resize-none" />
            </Field>
            {/* Honeypot — hidden from humans, bots tend to fill it */}
            <input tabIndex={-1} autoComplete="off" aria-hidden name="website" value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="absolute -left-[9999px] size-px opacity-0" />
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-line bg-panel p-6">
          <h2 className="font-display text-2xl font-extrabold uppercase">{t("summary")}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row k={t("step1")} v={<span className="capitalize">{fmtDay(date, { weekday: "short", day: "numeric", month: "short" })}</span>} />
            <Row k={t("step2")} v={slot ? `${slot.label} – ${endLabel}` : "—"} />
            <Row k={t("step3")} v={slot ? formatDuration(duration, locale) : "—"} />
          </dl>
          <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
            <span className="text-sm text-muted">{t("total")}</span>
            <span className="font-display text-4xl font-extrabold text-lime">{slot ? formatPrice(price) : "—"}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{t("payOnSite")}</p>

          <div className="mt-5">
            <Turnstile onToken={setCaptcha} resetKey={captchaKey} />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!slot || submitting || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-lime py-4 text-lg font-extrabold text-ink transition hover:bg-lime-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting && <Loader2 className="size-5 animate-spin" />}
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </aside>
    </form>
  );
}

function StepTitle({ n, icon, children }: { n: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase">
      <span className="grid size-8 place-items-center rounded-full bg-lime font-sans text-sm text-ink">{n}</span>
      {children}
      {icon && <span className="text-muted">{icon}</span>}
    </h2>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
