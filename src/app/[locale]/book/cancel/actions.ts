"use server";
import { redirect } from "next/navigation";
import { cancelByToken } from "@/lib/booking";

export async function cancelAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "ro";
  const res = await cancelByToken(token);
  redirect(`/${locale}/book/cancel?token=${encodeURIComponent(token)}&result=${res.status}`);
}
