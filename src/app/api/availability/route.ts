import { NextResponse } from "next/server";
import { getDayAvailability } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const data = await getDayAvailability(date);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
