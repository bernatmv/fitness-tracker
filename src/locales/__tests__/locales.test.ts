import { SUPPORTED_LANGUAGES } from '../languages';
import en from '../en.json';
import ca from '../ca.json';
import de from '../de.json';
import es from '../es.json';
import fr from '../fr.json';
// Named itTranslation so the import does not shadow Jest's `it`
import itTranslation from '../it.json';
import pl from '../pl.json';

const TRANSLATIONS: Record<string, object> = {
  en,
  ca,
  de,
  es,
  fr,
  it: itTranslation,
  pl,
};

/**
 * Flatten a nested translation object into dot-separated key paths
 */
const FlattenKeys = (obj: object, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? FlattenKeys(value, path)
      : [path];
  });

/**
 * Extract {{placeholder}} names used in a translation string
 */
const GetPlaceholders = (value: string): string[] =>
  (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();

const GetValueAtPath = (obj: object, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
      obj
    );

describe('locales', () => {
  it('has a translation file registered for every supported language', () => {
    SUPPORTED_LANGUAGES.forEach(language => {
      expect(TRANSLATIONS[language.code]).toBeDefined();
    });
  });

  it('has unique language codes', () => {
    const codes = SUPPORTED_LANGUAGES.map(language => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  const enKeys = FlattenKeys(en);

  SUPPORTED_LANGUAGES.filter(language => language.code !== 'en').forEach(
    language => {
      describe(language.code, () => {
        const translation = TRANSLATIONS[language.code];

        it('covers every English key', () => {
          const keys = new Set(FlattenKeys(translation));
          const missing = enKeys.filter(key => !keys.has(key));
          expect(missing).toEqual([]);
        });

        it('keeps interpolation placeholders intact', () => {
          enKeys.forEach(key => {
            const enValue = GetValueAtPath(en, key);
            const localizedValue = GetValueAtPath(translation, key);
            if (
              typeof enValue === 'string' &&
              typeof localizedValue === 'string'
            ) {
              expect({
                key,
                placeholders: GetPlaceholders(localizedValue),
              }).toEqual({
                key,
                placeholders: GetPlaceholders(enValue),
              });
            }
          });
        });
      });
    }
  );
});
