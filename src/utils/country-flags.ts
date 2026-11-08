// Turns a country name into its flag emoji, to be used throughout the app
// "🇫🇷 Chamonix, France" instead of just the text

// This is a plain lookup list for now. It only has the countries in our mock data.
// TODO: this doesn't scale -- there are ~195 countries. The real fix is to store a
// two-letter country code on Place (like "FR") instead of the full country name,
// because a code can be turned into a flag with a formula instead of a list.
// ! I'm sure there's a library for this somewhere

const flagsByCountry: Record<string, string> = {
  France: '🇫🇷',
  Switzerland: '🇨🇭',
  Italy: '🇮🇹',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  Portugal: '🇵🇹',
  Austria: '🇦🇹',
  'United States': '🇺🇸',
};

export function getCountryFlag(country: string) {
  // If the country isn't in the list, return an empty string so nothing shows.
  if (flagsByCountry[country] === undefined) {
    return '';
  }

  return flagsByCountry[country];
}
