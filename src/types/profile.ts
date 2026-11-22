// A user's profile: who they are, where they live/travel, and their posts.
// Used by the Profile Page and Edit profile.
// See src/types/template-type.ts if you want to see how a type file is put together.

export type Profile = {
  id: string; // User ID; uniquely identifies this profile (the "key")
  name: string;
  username: string;
  profilePicture?: string; // URL to the image; missing means show initials (see Avatar)
  // The initials' background color (0-359, a hue) when there's no photo. Missing
  // means pick one from the user id (not the name), so it never changes just
  // because they rename themselves.
  avatarHue?: number;
  bio?: string; // short description shown next to the avatar (optional)
  // auto: current travel city, else dream trip. custom: coverImage. none: no cover band at all.
  coverMode: 'auto' | 'custom' | 'none';
  coverImage?: string; // only used when coverMode is 'custom'
  // Whether coverImage came from the Dream Trip picker rather than an
  // upload -- both save the same way, so this is the only way to tell them
  // apart (edit-cover-panel.tsx, profile.tsx's auto-pick-on-first-setup).
  coverIsDreamTrip: boolean;
  // A src/services/profile-cities.ts id; their "home base". Missing until they set
  // one, or when their "Lives in" setting hides the city from you.
  homeCityId?: string;
  dreamTripCityId?: string; // a profile-cities.ts id; used for the cover fallback when home
  // Your own status, in full, with how much of it each audience sees. Only your
  // own profile has it: the database never sends someone's whole status to
  // anyone else (docs/backend-plan.md, profile_locations).
  status?: OwnTravelStatus;
  // The status as the signed-in user may see it, already trimmed by the
  // database. null means it's hidden from you. Use this one for display.
  visibleStatus?: VisibleTravelStatus | null;
  // closeFriendIds lives in Settings now, not here -- Settings is never
  // fetched by anyone but its own owner, and this list shouldn't be either.
  goals?: TravelGoal[]; // yearly travel goals; progress is calculated, not stored
  interestIds: string[]; // src/services/interests.ts ids
  // Who follows whom now lives in src/services/follows.ts as a `follows` table,
  // not on the profile itself (see getFollowerIds/getFollowingIds).
};

// Where the user is right now. City and country are picked from the same city
// list as "Lives in"/"Dream trip" (src/services/profile-cities.ts), so country
// is always a full name, e.g. "France" -- never a typed-in value or a code.
// Your own status, plus how much of it each audience can see.
export type OwnTravelStatus = TravelStatus & {
  sharing: {
    closeFriends: StatusSharing;
    everyone: StatusSharing;
  };
};

export type TravelStatus =
  | { kind: 'home' }
  | { kind: 'traveling'; city: string; country: string; until?: string } // until: "2026-11-20"
  | { kind: 'planning'; city: string; country: string; month?: string }; // month: "2026-12"

// Three independent choices for how much of the status someone can see.
// `dates` only has an effect when `country` is also on -- a date with no
// place attached isn't useful on its own (see trimStatus in status-text.ts).
// All three off is the same as the old "hidden": no status pill at all.
export type StatusSharing = {
  country: boolean; // "Traveling · Italy"
  city: boolean; // adds ", Rome" to the country
  dates: boolean; // adds "· until Nov 12" -- needs country on too
};

// What's left of a TravelStatus after getVisibleStatus trims it for a viewer.
// Shaped like TravelStatus, but country/city/until/month may each be
// missing even while traveling/planning, since a given viewer might not be
// allowed to see them.
export type VisibleTravelStatus =
  | { kind: 'home' }
  | { kind: 'traveling'; country?: string; city?: string; until?: string }
  | { kind: 'planning'; country?: string; city?: string; month?: string };

export type TravelGoal = {
  year: number;
  metric: 'countries' | 'cities' | 'places';
  target: number; // progress is calculated from reviews, not stored
};
