import { readFileSync } from 'fs';
import { resolve } from 'path';
import appConfig from '../../../app.json';

const APP_DISPLAY_NAME = 'Wall of Truth';

describe('installed app name', () => {
  it('uses the product name in React Native and both native platforms', () => {
    const androidStrings = readFileSync(
      resolve('android/app/src/main/res/values/strings.xml'),
      'utf8'
    );
    const iosInfo = readFileSync(
      resolve('ios/FitnessTracker/Info.plist'),
      'utf8'
    );

    expect(appConfig.displayName).toBe(APP_DISPLAY_NAME);
    expect(androidStrings).toContain(
      `<string name="app_name">${APP_DISPLAY_NAME}</string>`
    );
    expect(iosInfo).toMatch(
      new RegExp(
        `<key>CFBundleDisplayName</key>\\r?\\n\\t<string>${APP_DISPLAY_NAME}</string>`
      )
    );
  });
});
