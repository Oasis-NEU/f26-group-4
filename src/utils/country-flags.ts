// Turns a country name into its flag emoji, to be used throughout the app
// "🇫🇷 Chamonix, France" instead of just the text.
//
// This used to be a hand-typed list of eight countries, with a TODO saying the
// real fix was to use the two-letter country code and work the flag out with a
// formula. That's now done in src/lib/countries.ts, which has every country
// and its code, so this file just forwards to it.
//
// Nothing else needed changing: getCountryFlag() still takes a country name and
// still gives back an empty string for a country it doesn't know.

import { countryFlag } from '@/lib/countries';

export function getCountryFlag(country: string) {
  return countryFlag(country);
}
