import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSettings } from "@/lib/settings";
import { bookingWindow } from "@/lib/booking";
import { BookingForm } from "./BookingForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "book" });
  return { title: t("title") };
}

export default async function BookPage({ params }: { params: Promise<{ locale: "ro" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("book");
  const settings = await getSettings();
  const { first, last } = bookingWindow(settings);
  const closedWeekdays = Object.entries(settings.hours)
    .filter(([, h]) => !h)
    .map(([d]) => Number(d));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
      <h1 className="font-display text-5xl font-extrabold uppercase">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>
      <BookingForm
        locale={locale}
        firstDate={first}
        lastDate={last}
        closedWeekdays={closedWeekdays}
        pricePerHour={settings.pricePerHour}
        holdMinutes={settings.pendingHoldMinutes}
      />
    </div>
  );
}
