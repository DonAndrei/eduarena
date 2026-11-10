"use server";
import { headers } from "next/headers";
import { createBooking, type BookingError } from "@/lib/booking";
import { verifyTurnstile } from "@/lib/turnstile";

export type SubmitResult = { ok: true } | { ok: false; error: BookingError | "UNKNOWN" };

export async function submitBooking(data: Record<string, unknown>): Promise<SubmitResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (!(await verifyTurnstile(data.turnstileToken as string | undefined, ip))) {
    return { ok: false, error: "CAPTCHA" };
  }
  try {
    return await createBooking(data, ip);
  } catch (e) {
    console.error(e);
    return { ok: false, error: "UNKNOWN" };
  }
}
