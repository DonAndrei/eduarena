"use client";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  const qs = search.toString();
  return (
    <div className="flex rounded-full border border-line p-0.5 text-xs font-bold">
      {(["ro", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: l })}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            l === locale ? "bg-lime text-ink" : "text-muted hover:text-text"
          }`}
          aria-pressed={l === locale}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
