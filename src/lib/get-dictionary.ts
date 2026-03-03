import 'server-only';

export type Locale = 'en' | 'vi';

const dictionaries = {
  en: () => import('../dictionaries/en.json').then(m => m.default),
  vi: () => import('../dictionaries/vi.json').then(m => m.default),
};

/**
 * Gets the dictionary for the given locale.
 * If the locale is not found, it falls back to the English dictionary.
 *
 * @param {Locale} locale - The locale to get the dictionary for.
 * @returns {Promise<Dictionary>} - A promise that resolves with the dictionary for the given locale.
 */
export async function getDictionary(locale: Locale): Promise<any> {
  try {
    // Try to get the dictionary for the given locale
    return dictionaries[locale]();
  } catch {
    // If the locale is not found, fall back to the English dictionary
    return dictionaries['en']();
  }
}
