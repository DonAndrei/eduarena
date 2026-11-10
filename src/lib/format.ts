import { TZ } from "./slots";

export type Locale = "ro" | "en";

const intlLocale = (l: string) => (l === "ro" ? "ro-RO" : "en-GB");

export function formatDateLong(d: Date, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(d: Date, locale: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** 90 → "1h 30m" / "1 h 30 min" */
export function formatDuration(minutes: number, locale: string) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === "ro") return m ? `${h} h ${m} min` : `${h} ${h === 1 ? "oră" : "ore"}`;
  return m ? `${h}h ${m}m` : `${h} ${h === 1 ? "hour" : "hours"}`;
}

export function formatPrice(amount: number) {
  return `${amount} lei`;
}

export function priceFor(minutes: number, pricePerHour: number) {
  return Math.round((minutes / 60) * pricePerHour);
}
