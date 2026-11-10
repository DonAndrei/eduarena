import { formatDateLong, formatDuration, formatTime } from "@/lib/format";

export function BookingSummary({ startAt, endAt, locale }: { startAt: Date; endAt: Date; locale: string }) {
  const minutes = (endAt.getTime() - startAt.getTime()) / 60000;
  return (
    <div className="rounded-2xl bg-panel-2 p-4 text-left text-sm">
      <p className="font-bold capitalize">{formatDateLong(startAt, locale)}</p>
      <p className="mt-1 text-muted">
        {formatTime(startAt, locale)} – {formatTime(endAt, locale)} · {formatDuration(minutes, locale)}
      </p>
    </div>
  );
}
