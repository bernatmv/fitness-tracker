import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import en from './en.json';
import ca from './ca.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import it from './it.json';
import pl from './pl.json';

/**
 * Get device locale
 */
const GetDeviceLocale = (): string => {
  const locales = getLocales();
  if (locales.length > 0) {
    const languageCode = locales[0].languageCode;
    return languageCode;
  }
  return 'en';
};

const resources = {
  en: { translation: en },
  ca: { translation: ca },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  it: { translation: it },
  pl: { translation: pl },
};

i18n.use(initReactI18next).init({
  resources,
  lng: GetDeviceLocale(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export default i18n;
