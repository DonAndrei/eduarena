import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LocaleSwitch } from "./LocaleSwitch";

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="EduArena">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm font-semibold">
          <Link href="/gallery" className="hidden rounded-lg px-3 py-2 text-muted hover:text-text sm:block">
            {t("gallery")}
          </Link>
          <Link href="/#contact" className="hidden rounded-lg px-3 py-2 text-muted hover:text-text sm:block">
            {t("contact")}
          </Link>
          <Suspense>
            <LocaleSwitch />
          </Suspense>
          <Link
            href="/book"
            className="rounded-full bg-lime px-4 py-2 font-bold text-ink transition hover:bg-lime-dim"
          >
            {t("book")}
          </Link>
        </nav>
      </div>
      <div className="flex justify-center gap-6 border-t border-line/60 py-2 text-sm font-semibold sm:hidden">
        <Link href="/gallery" className="text-muted">{t("gallery")}</Link>
        <Link href="/#contact" className="text-muted">{t("contact")}</Link>
      </div>
    </header>
  );
}
