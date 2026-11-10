"use server";
import { randomBytes } from "crypto";
import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminSession, requireAdmin } from "@/lib/auth";
import { isDateString, venueTime, type WeeklyHours } from "@/lib/slots";

const MIN = 60_000;
const token = () => randomBytes(24).toString("base64url");

export async function login(_: unknown, formData: FormData) {
  const given = Buffer.from(String(formData.get("password") ?? ""));
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? "");
  const ok = expected.length > 0 && given.length === expected.length && timingSafeEqual(given, expected);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // slow down brute force
    return { error: "Parolă greșită." };
  }
  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();
  redirect("/admin");
}

export async function logout() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}

export async function adminCancel(formData: FormData) {
  await requireAdmin();
  await prisma.booking.update({
    where: { id: String(formData.get("id")) },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  revalidatePath("/admin");
}

export async function adminConfirm(formData: FormData) {
  await requireAdmin();
  await prisma.booking.update({
    where: { id: String(formData.get("id")) },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  revalidatePath("/admin");
}

function parseRange(formData: FormData) {
  const date = String(formData.get("date"));
  const from = String(formData.get("from"));
  if (!isDateString(date) || !/^\d{2}:\d{2}$/.test(from)) return null;
  const start = venueTime(date, from);
  let end: Date;
  if (formData.get("duration")) {
    end = new Date(start.getTime() + Number(formData.get("duration")) * MIN);
  } else {
    const to = String(formData.get("to"));
    if (!/^\d{2}:\d{2}$/.test(to)) return null;
    end = venueTime(date, to);
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * MIN);
  }
  return { date, start, end };
}

export type ActionState = { error?: string; ok?: string } | undefined;

export async function adminAddBooking(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const r = parseRange(formData);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!r || !name) return { error: "Completează data, ora și numele." };
  try {
    await prisma.booking.create({
      data: {
        startAt: r.start,
        endAt: r.end,
        name,
        phone,
        email: "",
        note: String(formData.get("note") ?? "").trim() || "Adăugată manual (telefon)",
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmToken: token(),
        cancelToken: token(),
      },
    });
  } catch (e) {
    if (String(e).includes("Booking_no_overlap")) return { error: "Intervalul se suprapune cu altă rezervare." };
    throw e;
  }
  revalidatePath("/admin");
  return { ok: "Rezervare adăugată." };
}

export async function adminBlock(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const r = parseRange(formData);
  if (!r) return { error: "Interval invalid." };
  await prisma.blockedSlot.create({
    data: { startAt: r.start, endAt: r.end, reason: String(formData.get("reason") ?? "").trim() || null },
  });
  revalidatePath("/admin");
  return { ok: "Interval blocat." };
}

export async function adminUnblock(formData: FormData) {
  await requireAdmin();
  await prisma.blockedSlot.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin");
}

export async function saveSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const hours: WeeklyHours = {};
  for (const d of ["0", "1", "2", "3", "4", "5", "6"]) {
    const closed = formData.get(`closed_${d}`) === "on";
    const open = String(formData.get(`open_${d}`));
    const close = String(formData.get(`close_${d}`));
    if (!closed && !(/^\d{2}:(00|30)$/.test(open) && /^\d{2}:(00|30)$/.test(close))) {
      return { error: "Orele trebuie să fie la fix sau la jumătate (ex: 09:00, 22:30)." };
    }
    hours[d] = closed ? null : { open, close };
  }
  const num = (k: string, min: number, max: number) => {
    const v = Number(formData.get(k));
    return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min;
  };
  const maxDuration = num("maxDurationMinutes", 60, 600);
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      hours,
      pricePerHour: num("pricePerHour", 0, 100000),
      maxAdvanceDays: num("maxAdvanceDays", 1, 365),
      pendingHoldMinutes: num("pendingHoldMinutes", 5, 1440),
      maxActivePerPerson: num("maxActivePerPerson", 1, 50),
      maxDurationMinutes: maxDuration - (maxDuration % 30),
    },
  });
  revalidatePath("/admin");
  return { ok: "Setări salvate." };
}
