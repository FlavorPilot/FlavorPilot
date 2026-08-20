import { locales, type Locale } from "@flavorpilot/flavor-engine";

export { locales };
export type { Locale };

export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);
