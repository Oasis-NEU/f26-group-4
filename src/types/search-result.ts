// What the search bar's results look like.
// Searching can return two different kinds of cards: a profile or a place.
// Used by the Search Bar.

export type ProfileSearchResult = {
  userId: string;
  name: string;
  username: string;
  profilePicture: string; // URL to the image
  currentCountry: string; // used to generate a flag emoji
};

export type PlaceSearchResult = {
  placeId: string;
  placeName: string;
  media: string[]; // photos/videos other users posted for this place
  address: string;
  rating: number; // average rating, out of 5
};

// A "discriminated union": one result is EITHER a profile result OR a place
// result, never both. The `kind` field is what tells you which one you have.
// e.g. if (result.kind === 'profile') { ...TypeScript now knows result.data is a ProfileSearchResult... }
export type SearchResult =
  | { kind: 'profile'; data: ProfileSearchResult }
  | { kind: 'place'; data: PlaceSearchResult };
