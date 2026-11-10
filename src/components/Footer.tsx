import { getTranslations } from "next-intl/server";
import { venue } from "@/content/venue";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";

export async function Footer() {
  const t = await getTranslations();
  const settings = await getSettings();
  const days = ["1", "2", "3", "4", "5", "6", "0"];
  const allSame = days.every(
    (d) => JSON.stringify(settings.hours[d]) === JSON.stringify(settings.hours["1"]),
  );
  return (
    <footer className="mt-24 border-t border-line bg-panel">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted">{venue.address}</p>
          <p className="text-sm">
            <a href={venue.phoneHref} className="hover:text-lime">{venue.phone}</a>
            <br />
            <a href={`mailto:${venue.email}`} className="hover:text-lime">{venue.email}</a>
          </p>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">{t("footer.hours")}</h3>
          <ul className="mt-3 max-w-60 space-y-1 text-sm text-muted">
            {allSame ? (
              <li className="flex justify-between gap-6">
                <span>{t("footer.everyDay")}</span>
                <span className="text-text">
                  {settings.hours["1"] ? `${settings.hours["1"].open} – ${settings.hours["1"].close}` : "—"}
                </span>
              </li>
            ) : (
              days.map((d) => (
                <li key={d} className="flex justify-between gap-6">
                  <span>{t(`days.${d}`)}</span>
                  <span className="text-text">
                    {settings.hours[d] ? `${settings.hours[d]!.open} – ${settings.hours[d]!.close}` : "—"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="text-sm text-muted sm:text-right">
          <div className="flex gap-4 sm:justify-end">
            <a href={venue.instagram} className="hover:text-lime" target="_blank" rel="noreferrer">Instagram</a>
            <a href={venue.facebook} className="hover:text-lime" target="_blank" rel="noreferrer">Facebook</a>
          </div>
          <p className="mt-6">© {new Date().getFullYear()} EduArena. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
