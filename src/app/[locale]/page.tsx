import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarCheck, Clock, Droplets, Phone, ShieldCheck, Sun } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { gallery, venue } from "@/content/venue";
import { Gallery } from "@/components/Gallery";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";

export default async function Home({ params }: { params: Promise<{ locale: "ro" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const settings = await getSettings();

  const features = [
    { icon: ShieldCheck, t: t("f1t"), d: t("f1d") },
    { icon: Sun, t: t("f2t"), d: t("f2d") },
    { icon: Droplets, t: t("f3t"), d: t("f3d") },
    { icon: CalendarCheck, t: t("f4t"), d: t("f4d") },
  ];
  const steps = [
    { t: t("how1t"), d: t("how1d") },
    { t: t("how2t"), d: t("how2d") },
    { t: t("how3t"), d: t("how3d") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="turf relative overflow-hidden border-b border-line">
        <PitchLines />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-lime">
            <span className="size-1.5 animate-pulse rounded-full bg-lime" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-6 max-w-3xl whitespace-pre-line font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text/80">{t("subtitle")}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/book"
              className="rounded-full bg-lime px-7 py-4 text-base font-extrabold text-ink shadow-[0_0_40px_-8px] shadow-lime/60 transition hover:bg-lime-dim"
            >
              {t("ctaBook")} →
            </Link>
            <Link
              href="/gallery"
              className="rounded-full border border-line bg-ink/40 px-7 py-4 font-bold transition hover:border-text/40"
            >
              {t("ctaGallery")}
            </Link>
            <span className="ml-1 text-sm font-semibold text-muted">
              {t("fromPrice", { price: formatPrice(settings.pricePerHour) })}
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">{t("featuresTitle")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-line bg-panel p-6">
              <f.icon className="size-7 text-lime" aria-hidden />
              <h3 className="mt-4 font-bold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">{t("howTitle")}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.t} className="relative rounded-2xl border border-line bg-panel p-6">
              <span className="font-display text-6xl font-extrabold text-lime/90">{i + 1}</span>
              <h3 className="mt-2 font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link href="/book" className="inline-flex items-center gap-2 font-bold text-lime hover:underline">
            <Clock className="size-4" /> {t("ctaBook")} →
          </Link>
        </div>
      </section>

      {/* Gallery preview */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">{t("galleryTitle")}</h2>
          <Link href="/gallery" className="shrink-0 text-sm font-bold text-lime hover:underline">
            {t("galleryAll")} →
          </Link>
        </div>
        <div className="mt-8">
          <Gallery images={gallery} locale={locale} variant="preview" />
        </div>
      </section>

      {/* Contact / map */}
      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-20">
        <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">{t("findUs")}</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-panel p-6">
            <div>
              <p className="text-lg font-bold">{venue.address}</p>
              <p className="mt-4 text-sm text-muted">{t("callUs")}</p>
              <a
                href={venue.phoneHref}
                className="mt-1 inline-flex items-center gap-2 font-display text-3xl font-extrabold text-lime"
              >
                <Phone className="size-6" /> {venue.phone}
              </a>
            </div>
            <Link
              href="/book"
              className="rounded-full bg-lime px-6 py-3 text-center font-extrabold text-ink transition hover:bg-lime-dim"
            >
              {t("ctaBook")}
            </Link>
          </div>
          <iframe
            title="Map"
            className="h-80 w-full rounded-2xl border border-line grayscale-[60%] invert-[90%] hue-rotate-180 lg:h-full lg:min-h-80"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.mapsQuery)}&z=14&output=embed`}
          />
        </div>
      </section>
    </>
  );
}

function PitchLines() {
  return (
    <svg
      className="pointer-events-none absolute -right-40 top-1/2 h-[140%] -translate-y-1/2 opacity-[0.12] sm:right-[-10%]"
      viewBox="0 0 600 400"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      aria-hidden
    >
      <rect x="10" y="10" width="580" height="380" rx="6" />
      <line x1="300" y1="10" x2="300" y2="390" />
      <circle cx="300" cy="200" r="60" />
      <rect x="10" y="120" width="70" height="160" />
      <rect x="520" y="120" width="70" height="160" />
    </svg>
  );
}
