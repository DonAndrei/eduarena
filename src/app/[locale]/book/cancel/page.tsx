import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBookingByCancelToken } from "@/lib/booking";
import { StatusCard } from "@/components/StatusCard";
import { BookingSummary } from "@/components/BookingSummary";
import { cancelAction } from "./actions";

export const metadata = { robots: { index: false } };

export default async function CancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; result?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, result } = await searchParams;
  const t = await getTranslations("cancel");
  const booking = token ? await getBookingByCancelToken(token) : null;

  if (!booking) return <div className="px-4"><StatusCard tone="bad" title={t("NOT_FOUND")} /></div>;

  if (result === "CANCELLED" || booking.status === "CANCELLED") {
    return (
      <div className="px-4">
        <StatusCard tone="ok" title={t(result === "CANCELLED" ? "CANCELLED" : "ALREADY")} text={t("CANCELLED_text")}>
          <BookingSummary startAt={booking.startAt} endAt={booking.endAt} locale={locale} />
        </StatusCard>
      </div>
    );
  }
  if (booking.startAt < new Date() || result === "PAST") {
    return <div className="px-4"><StatusCard tone="warn" title={t("PAST")} /></div>;
  }
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    return <div className="px-4"><StatusCard tone="bad" title={t("NOT_FOUND")} /></div>;
  }

  // Cancelling requires a click (POST), so email link scanners can't cancel by just opening the link.
  return (
    <div className="px-4">
      <StatusCard tone="warn" title={t("title")} text={t("question")}>
        <BookingSummary startAt={booking.startAt} endAt={booking.endAt} locale={locale} />
        <form action={cancelAction} className="mt-6 flex justify-center gap-3">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="locale" value={locale} />
          <Link href="/" className="rounded-full border border-line px-5 py-2.5 font-bold">{t("keep")}</Link>
          <button className="rounded-full bg-danger px-5 py-2.5 font-bold text-ink">{t("confirmBtn")}</button>
        </form>
      </StatusCard>
    </div>
  );
}
