import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOURS,
  durationOptions,
  generateDaySlots,
  isBookable,
  openingInterval,
  venueTime,
  type WeeklyHours,
} from "./slots";

const date = "2026-11-12"; // Thursday
const past = new Date("2026-01-01T00:00:00Z");

describe("venueTime", () => {
  it("uses Bucharest time (UTC+2 in winter, UTC+3 in summer)", () => {
    expect(venueTime("2026-11-12", "18:00").toISOString()).toBe("2026-11-12T16:00:00.000Z");
    expect(venueTime("2026-07-12", "18:00").toISOString()).toBe("2026-07-12T15:00:00.000Z");
  });
});

describe("openingInterval", () => {
  it("handles closing at midnight", () => {
    const hours: WeeklyHours = { ...DEFAULT_HOURS, "4": { open: "10:00", close: "00:00" } };
    const i = openingInterval(date, hours)!;
    expect(i.end.getTime() - i.start.getTime()).toBe(14 * 3600_000);
  });
  it("returns null on closed days", () => {
    expect(openingInterval(date, { ...DEFAULT_HOURS, "4": null })).toBeNull();
  });
});

describe("generateDaySlots", () => {
  const base = { date, hours: DEFAULT_HOURS, now: past, maxDurationMinutes: 180 };

  it("creates 30-min starts, last one at least 1h before close", () => {
    const slots = generateDaySlots({ ...base, busy: [] });
    expect(slots[0].label).toBe("09:00");
    expect(slots[1].label).toBe("09:30");
    expect(slots.at(-1)!.label).toBe("22:00");
    expect(slots.at(-1)!.maxDuration).toBe(60);
    expect(slots[0].maxDuration).toBe(180);
  });

  it("blocks starts inside busy intervals and limits duration before them", () => {
    const busy = [{ start: venueTime(date, "18:00"), end: venueTime(date, "19:30") }];
    const slots = generateDaySlots({ ...base, busy });
    const by = (l: string) => slots.find((s) => s.label === l)!;
    expect(by("16:30").maxDuration).toBe(90);
    expect(by("17:00").maxDuration).toBe(60);
    expect(by("17:30").available).toBe(false); // only 30 min before next booking
    expect(by("18:00").available).toBe(false);
    expect(by("19:00").available).toBe(false);
    expect(by("19:30").available).toBe(true);
  });

  it("marks past starts unavailable", () => {
    const slots = generateDaySlots({ ...base, busy: [], now: venueTime(date, "12:10") });
    expect(slots.find((s) => s.label === "12:00")!.available).toBe(false);
    expect(slots.find((s) => s.label === "12:30")!.available).toBe(true);
  });
});

describe("isBookable", () => {
  const base = { date, hours: DEFAULT_HOURS, now: past, maxDurationMinutes: 180, busy: [] };
  it("accepts 1h, 1.5h, 2h", () => {
    for (const d of [60, 90, 120]) {
      expect(isBookable({ ...base, start: venueTime(date, "10:00"), durationMinutes: d })).toBe(true);
    }
  });
  it("rejects < 1h, non-30 steps, off-grid starts, over cap, past closing", () => {
    expect(isBookable({ ...base, start: venueTime(date, "10:00"), durationMinutes: 30 })).toBe(false);
    expect(isBookable({ ...base, start: venueTime(date, "10:00"), durationMinutes: 75 })).toBe(false);
    expect(isBookable({ ...base, start: venueTime(date, "10:15"), durationMinutes: 60 })).toBe(false);
    expect(isBookable({ ...base, start: venueTime(date, "10:00"), durationMinutes: 210 })).toBe(false);
    expect(isBookable({ ...base, start: venueTime(date, "22:00"), durationMinutes: 90 })).toBe(false);
  });
});

describe("durationOptions", () => {
  it("steps by 30 from 60", () => {
    expect(durationOptions(150)).toEqual([60, 90, 120, 150]);
    expect(durationOptions(0)).toEqual([]);
  });
});
