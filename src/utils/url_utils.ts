import { PRIVACY_POLICY_BASE_URL, PRIVACY_POLICY_LANGUAGES } from '@constants';

/**
 * Returns the privacy policy URL for the given language,
 * falling back to English when no localized page exists
 */
export const GetPrivacyPolicyUrl = (language: string): string => {
  const supported = (PRIVACY_POLICY_LANGUAGES as readonly string[]).includes(
    language
  )
    ? language
    : 'en';
  return `${PRIVACY_POLICY_BASE_URL}/${supported}/privacy/`;
};
