import "server-only";
import { prisma } from "./db";
import { DEFAULT_HOURS, type WeeklyHours } from "./slots";

export type VenueSettings = {
  hours: WeeklyHours;
  pricePerHour: number;
  maxAdvanceDays: number;
  pendingHoldMinutes: number;
  maxActivePerPerson: number;
  maxDurationMinutes: number;
};

export async function getSettings(): Promise<VenueSettings> {
  const row = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, hours: DEFAULT_HOURS },
  });
  return { ...row, hours: row.hours as WeeklyHours };
}
