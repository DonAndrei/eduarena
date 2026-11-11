import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ro", "en"],
  defaultLocale: "ro",
  // Always open in Romanian; English only when the visitor picks it.
  localeDetection: false,
});
