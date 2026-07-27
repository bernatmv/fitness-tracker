import { GetPrivacyPolicyUrl } from '../url_utils';

describe('GetPrivacyPolicyUrl', () => {
  it('returns the localized page for supported languages', () => {
    expect(GetPrivacyPolicyUrl('es')).toBe(
      'https://www.wall-of-truth.com/es/privacy/'
    );
  });

  it('falls back to English for languages without a published page', () => {
    expect(GetPrivacyPolicyUrl('pl')).toBe(
      'https://www.wall-of-truth.com/en/privacy/'
    );
  });
});
