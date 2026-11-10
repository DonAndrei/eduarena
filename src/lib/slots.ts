import { TZDate } from "@date-fns/tz";

/** Venue time zone — every date/time the customer sees is in this zone. */
export const TZ = "Europe/Bucharest";
export const STEP_MINUTES = 30;
export const MIN_DURATION_MINUTES = 60;

export type DayHours = { open: string; close: string } | null;
/** Keyed by weekday: "0" = Sunday … "6" = Saturday. */
export type WeeklyHours = Record<string, DayHours>;

export type Interval = { start: Date; end: Date };

export type Slot = {
  start: Date;
  /** "HH:MM" in venue time */
  label: string;
  available: boolean;
  /** Longest booking (minutes) that fits from this start; 0 when unavailable. */
  maxDuration: number;
};

export const DEFAULT_HOURS: WeeklyHours = {
  "0": { open: "09:00", close: "23:00" },
  "1": { open: "09:00", close: "23:00" },
  "2": { open: "09:00", close: "23:00" },
  "3": { open: "09:00", close: "23:00" },
  "4": { open: "09:00", close: "23:00" },
  "5": { open: "09:00", close: "23:00" },
  "6": { open: "09:00", close: "23:00" },
};

const MIN = 60_000;

export function isDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function parseHM(hm: string): [number, number] {
  const [h, m] = hm.split(":").map(Number);
  return [h, m];
}

/** Instant for a wall-clock time on a date in the venue zone. */
export function venueTime(dateStr: string, hm: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, m] = parseHM(hm);
  return new Date(new TZDate(y, mo - 1, d, h, m, TZ).getTime());
}

/** "YYYY-MM-DD" of an instant in the venue zone. */
export function venueDateString(at: Date): string {
  const t = new TZDate(at.getTime(), TZ);
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${mm}-${dd}`;
}

/** "HH:MM" of an instant in the venue zone. */
export function venueTimeLabel(at: Date): string {
  const t = new TZDate(at.getTime(), TZ);
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function weekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Opening interval of a given day. A close time of "00:00" / "24:00", or any close
 * earlier than open, means the venue closes after midnight (next calendar day).
 */
export function openingInterval(dateStr: string, hours: WeeklyHours): Interval | null {
  const day = hours[String(weekday(dateStr))];
  if (!day) return null;
  const start = venueTime(dateStr, day.open);
  const closeHM = day.close === "24:00" ? "00:00" : day.close;
  let end = venueTime(dateStr, closeHM);
  if (end <= start) end = venueTime(addDays(dateStr, 1), closeHM);
  return { start, end };
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Durations offered for a slot: 60, 90, 120 … up to maxDuration. */
export function durationOptions(maxDuration: number): number[] {
  const out: number[] = [];
  for (let d = MIN_DURATION_MINUTES; d <= maxDuration; d += STEP_MINUTES) out.push(d);
  return out;
}

export function generateDaySlots(params: {
  date: string;
  hours: WeeklyHours;
  busy: Interval[];
  now: Date;
  maxDurationMinutes: number;
}): Slot[] {
  const { date, hours, busy, now, maxDurationMinutes } = params;
  const open = openingInterval(date, hours);
  if (!open) return [];

  const sorted = [...busy].sort((a, b) => a.start.getTime() - b.start.getTime());
  const slots: Slot[] = [];

  for (
    let t = open.start.getTime();
    t + MIN_DURATION_MINUTES * MIN <= open.end.getTime();
    t += STEP_MINUTES * MIN
  ) {
    const start = new Date(t);
    let maxDuration = 0;

    const inPast = start.getTime() < now.getTime();
    const insideBusy = sorted.some((b) => b.start <= start && start < b.end);
    if (!inPast && !insideBusy) {
      const nextBusy = sorted.find((b) => b.start > start);
      const limit = Math.min(
        open.end.getTime(),
        nextBusy ? nextBusy.start.getTime() : Infinity,
        t + maxDurationMinutes * MIN,
      );
      const free = Math.floor((limit - t) / MIN);
      maxDuration = free - (free % STEP_MINUTES);
      if (maxDuration < MIN_DURATION_MINUTES) maxDuration = 0;
    }

    slots.push({
      start,
      label: venueTimeLabel(start),
      available: maxDuration > 0,
      maxDuration,
    });
  }
  return slots;
}

/** True when [start, start+duration) is a bookable choice for that day. */
export function isBookable(params: {
  date: string;
  start: Date;
  durationMinutes: number;
  hours: WeeklyHours;
  busy: Interval[];
  now: Date;
  maxDurationMinutes: number;
}): boolean {
  const { durationMinutes } = params;
  if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes % STEP_MINUTES !== 0) return false;
  const slot = generateDaySlots(params).find((s) => s.start.getTime() === params.start.getTime());
  return !!slot && slot.available && durationMinutes <= slot.maxDuration;
}

export { overlaps };
