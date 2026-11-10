import { getTranslations, setRequestLocale } from "next-intl/server";
import { gallery } from "@/content/venue";
import { Gallery } from "@/components/Gallery";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return { title: t("title") };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: "ro" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="font-display text-5xl font-extrabold uppercase">{t("gallery.title")}</h1>
      <p className="mt-3 text-muted">{t("gallery.subtitle")}</p>
      <div className="mt-10">
        <Gallery images={gallery} locale={locale} />
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/book"
          className="inline-block rounded-full bg-lime px-8 py-4 font-extrabold text-ink transition hover:bg-lime-dim"
        >
          {t("home.ctaBook")} →
        </Link>
      </div>
    </div>
  );
}
