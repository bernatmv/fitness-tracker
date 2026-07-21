/**
 * Languages the app ships translations for.
 * The Settings language list and the i18n resource registry derive from
 * this single source so adding a locale only touches this file, its JSON
 * translation file and the date-fns locale map.
 */
export type SupportedLanguage = {
  code: string;
  nativeName: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'ca', nativeName: 'Català' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'es', nativeName: 'Español' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'pl', nativeName: 'Polski' },
];
