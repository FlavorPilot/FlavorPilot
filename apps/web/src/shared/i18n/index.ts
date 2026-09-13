import { en } from './en';
import { uk } from './uk';
export type Locale = 'en' | 'uk';
export type MessageKey = keyof typeof en.messages;
export type Dictionary = {
    [K in keyof typeof en]: {
        [P in keyof typeof en[K]]: string;
    };
};
const translations: Record<Locale, Dictionary> = { en, uk };
export const isLocale = (value: string): value is Locale => value === 'en' || value === 'uk';
export const getDictionary = (locale: Locale): Dictionary => translations[locale];
export function formatNumber(value: number, locale: Locale, digits = 1): string {
    return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { maximumFractionDigits: digits }).format(value);
}
