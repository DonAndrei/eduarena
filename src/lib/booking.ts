import "server-only";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "./db";
import { getSettings, type VenueSettings } from "./settings";
import {
  addDays,
  generateDaySlots,
  isBookable,
  isDateString,
  openingInterval,
  venueDateString,
  type Interval,
} from "./slots";
import { sendEmail } from "./email";
import { confirmEmail, confirmedEmail, ownerEmail } from "./emails";

const MIN = 60_000;
const IP_ATTEMPTS_PER_HOUR = 8;

const token = () => randomBytes(24).toString("base64url");

/** Pending bookings older than the hold window no longer block the pitch. */
async function expireStalePending(settings: VenueSettings) {
  await prisma.booking.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - settings.pendingHoldMinutes * MIN) },
    },
    data: { status: "EXPIRED" },
  });
}

/** Busy intervals (bookings + owner blocks) overlapping [from, to). */
export async function getBusy(from: Date, to: Date): Promise<Interval[]> {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { status: { in: ["PENDING", "CONFIRMED"] }, startAt: { lt: to }, endAt: { gt: from } },
      select: { startAt: true, endAt: true },
    }),
    prisma.blockedSlot.findMany({
      where: { startAt: { lt: to }, endAt: { gt: from } },
      select: { startAt: true, endAt: true },
    }),
  ]);
  return [...bookings, ...blocks].map((b) => ({ start: b.startAt, end: b.endAt }));
}

export function bookingWindow(settings: VenueSettings, now = new Date()) {
  const first = venueDateString(now);
  return { first, last: addDays(first, settings.maxAdvanceDays) };
}

export type DayAvailability = {
  date: string;
  open: boolean;
  pricePerHour: number;
  slots: { start: string; label: string; maxDuration: number }[];
};

export async function getDayAvailability(date: string): Promise<DayAvailability> {
  const settings = await getSettings();
  const { first, last } = bookingWindow(settings);
  const closed = { date, open: false, slots: [], pricePerHour: settings.pricePerHour };
  if (!isDateString(date) || date < first || date > last) return closed;
  await expireStalePending(settings);
  const open = openingInterval(date, settings.hours);
  if (!open) return closed;
  const busy = await getBusy(open.start, open.end);
  const slots = generateDaySlots({
    date,
    hours: settings.hours,
    busy,
    now: new Date(),
    maxDurationMinutes: settings.maxDurationMinutes,
  });
  return {
    date,
    open: true,
    pricePerHour: settings.pricePerHour,
    slots: slots.map((s) => ({ start: s.start.toISOString(), label: s.label, maxDuration: s.maxDuration })),
  };
}

export const bookingInput = z.object({
  date: z.string().refine(isDateString),
  start: z.string().datetime(),
  duration: z.coerce.number().int(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  phone: z
    .string()
    .trim()
    .transform((p) => p.replace(/[\s().-]/g, ""))
    .refine((p) => /^\+?\d{9,15}$/.test(p)),
  note: z.string().trim().max(500).optional(),
  locale: z.enum(["ro", "en"]),
  website: z.string().max(0).optional(), // honeypot: real users never fill this
});

export type BookingError =
  | "INVALID"
  | "SLOT_TAKEN"
  | "OUT_OF_RANGE"
  | "TOO_MANY_ACTIVE"
  | "RATE_LIMITED"
  | "CAPTCHA";

export async function createBooking(
  raw: unknown,
  ip: string,
): Promise<{ ok: true } | { ok: false; error: BookingError }> {
  const parsed = bookingInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const input = parsed.data;

  // Per-IP rate limit
  const since = new Date(Date.now() - 60 * MIN);
  const attempts = await prisma.bookingAttempt.count({ where: { ip, createdAt: { gt: since } } });
  if (attempts >= IP_ATTEMPTS_PER_HOUR) return { ok: false, error: "RATE_LIMITED" };
  await prisma.bookingAttempt.create({ data: { ip } });

  const settings = await getSettings();
  const { first, last } = bookingWindow(settings);
  if (input.date < first || input.date > last) return { ok: false, error: "OUT_OF_RANGE" };

  await expireStalePending(settings);

  // Limit active future bookings per person (by email OR phone)
  const active = await prisma.booking.count({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      endAt: { gt: new Date() },
      OR: [{ email: input.email }, { phone: input.phone }],
    },
  });
  if (active >= settings.maxActivePerPerson) return { ok: false, error: "TOO_MANY_ACTIVE" };

  const start = new Date(input.start);
  const end = new Date(start.getTime() + input.duration * MIN);
  const open = openingInterval(input.date, settings.hours);
  if (!open) return { ok: false, error: "SLOT_TAKEN" };
  const busy = await getBusy(open.start, open.end);
  const ok = isBookable({
    date: input.date,
    start,
    durationMinutes: input.duration,
    hours: settings.hours,
    busy,
    now: new Date(),
    maxDurationMinutes: settings.maxDurationMinutes,
  });
  if (!ok) return { ok: false, error: "SLOT_TAKEN" };

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        startAt: start,
        endAt: end,
        name: input.name,
        email: input.email,
        phone: input.phone,
        note: input.note || null,
        locale: input.locale,
        confirmToken: token(),
        cancelToken: token(),
        ip,
      },
    });
  } catch (e) {
    // Exclusion constraint: someone grabbed the slot a moment earlier
    if (String(e).includes("Booking_no_overlap")) return { ok: false, error: "SLOT_TAKEN" };
    throw e;
  }

  const mail = confirmEmail(
    booking,
    input.locale,
    booking.confirmToken,
    settings.pricePerHour,
    settings.pendingHoldMinutes,
  );
  await sendEmail(booking.email, mail.subject, mail.html, mail.text);
  return { ok: true };
}

export async function confirmBooking(confirmToken: string) {
  const settings = await getSettings();
  const b = await prisma.booking.findUnique({ where: { confirmToken } });
  if (!b) return { status: "NOT_FOUND" as const };
  if (b.status === "CONFIRMED") return { status: "ALREADY" as const, booking: b };
  if (b.status !== "PENDING") return { status: "EXPIRED" as const };
  if (b.createdAt.getTime() < Date.now() - settings.pendingHoldMinutes * MIN) {
    await prisma.booking.update({ where: { id: b.id }, data: { status: "EXPIRED" } });
    return { status: "EXPIRED" as const };
  }
  const updated = await prisma.booking.update({
    where: { id: b.id },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  const mail = confirmedEmail(updated, updated.locale, updated.cancelToken, settings.pricePerHour);
  await sendEmail(updated.email, mail.subject, mail.html, mail.text);
  if (process.env.OWNER_EMAIL) {
    const o = ownerEmail("new", updated, settings.pricePerHour);
    await sendEmail(process.env.OWNER_EMAIL, o.subject, o.html, o.text);
  }
  return { status: "CONFIRMED" as const, booking: updated };
}

export async function getBookingByCancelToken(cancelToken: string) {
  return prisma.booking.findUnique({ where: { cancelToken } });
}

export async function cancelByToken(cancelToken: string) {
  const settings = await getSettings();
  const b = await prisma.booking.findUnique({ where: { cancelToken } });
  if (!b) return { status: "NOT_FOUND" as const };
  if (b.status === "CANCELLED") return { status: "ALREADY" as const, booking: b };
  if (b.status !== "CONFIRMED" && b.status !== "PENDING") return { status: "NOT_FOUND" as const };
  if (b.startAt.getTime() < Date.now()) return { status: "PAST" as const, booking: b };
  const updated = await prisma.booking.update({
    where: { id: b.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  if (process.env.OWNER_EMAIL && b.status === "CONFIRMED") {
    const o = ownerEmail("cancelled", updated, settings.pricePerHour);
    await sendEmail(process.env.OWNER_EMAIL, o.subject, o.html, o.text);
  }
  return { status: "CANCELLED" as const, booking: updated };
}
