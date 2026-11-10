// Verifies the DB refuses overlapping active bookings. Run: npx tsx scripts/check-overlap.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const mk = (s: string, e: string, tag: string) =>
  prisma.booking.create({
    data: {
      startAt: new Date(s),
      endAt: new Date(e),
      name: "overlap-test",
      email: "overlap@test.local",
      phone: "0",
      confirmToken: `c-${tag}-${Date.now()}`,
      cancelToken: `x-${tag}-${Date.now()}`,
      status: "CONFIRMED",
    },
  });

async function main() {
  const results = await Promise.allSettled([
    mk("2027-01-05T10:00:00Z", "2027-01-05T11:00:00Z", "a"),
    mk("2027-01-05T10:30:00Z", "2027-01-05T11:30:00Z", "b"),
  ]);
  console.log(
    "concurrent overlapping:",
    results.map((r) =>
      r.status === "fulfilled" ? "created" : String(r.reason).includes("Booking_no_overlap") ? "rejected (overlap)" : `error: ${r.reason}`,
    ),
  );
  const back = await mk("2027-01-05T11:30:00Z", "2027-01-05T12:30:00Z", "c").then(
    () => "created",
    (e) => `error ${e}`,
  );
  console.log("back-to-back:", back);
  await prisma.booking.deleteMany({ where: { email: "overlap@test.local" } });
}

main().finally(() => prisma.$disconnect());
