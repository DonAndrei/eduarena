import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { confirmBooking } from "@/lib/booking";
import { StatusCard } from "@/components/StatusCard";
import { BookingSummary } from "@/components/BookingSummary";

export const metadata = { robots: { index: false } };

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const t = await getTranslations("confirm");
  const res = token ? await confirmBooking(token) : { status: "NOT_FOUND" as const };
  const tone = res.status === "CONFIRMED" || res.status === "ALREADY" ? "ok" : res.status === "EXPIRED" ? "warn" : "bad";

  return (
    <div className="px-4">
      <StatusCard tone={tone} title={t(res.status)} text={t(`${res.status}_text`)}>
        {"booking" in res && res.booking && (
          <BookingSummary startAt={res.booking.startAt} endAt={res.booking.endAt} locale={locale} />
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-full border border-line px-5 py-2.5 font-bold">{t("backHome")}</Link>
          {tone !== "ok" && (
            <Link href="/book" className="rounded-full bg-lime px-5 py-2.5 font-bold text-ink">{t("bookAgain")}</Link>
          )}
        </div>
      </StatusCard>
    </div>
  );
}
