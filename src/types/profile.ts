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
  homeCityId: string; // a src/services/profile-cities.ts id; their "home base"
  dreamTripCityId?: string; // a profile-cities.ts id; used for the cover fallback when home
  status: TravelStatus & {
    sharing: {
      // how much of the status each audience can see
      closeFriends: StatusDetail;
      everyone: StatusDetail;
    };
  };
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
export type TravelStatus =
  | { kind: 'home' }
  | { kind: 'traveling'; city: string; country: string; until?: string } // until: "2026-11-20"
  | { kind: 'planning'; city: string; country: string; month?: string }; // month: "2026-12"

// How much of the status someone can see:
// hidden  -> no status pill
// country -> "Traveling · Italy"
// city    -> "Traveling · Rome, Italy"
// full    -> "Traveling · Rome, Italy · until Nov 12"
export type StatusDetail = 'hidden' | 'country' | 'city' | 'full';

// What's left of a TravelStatus after getVisibleStatus trims it for a viewer.
// Shaped like TravelStatus, but city/until/month may be missing even while
// traveling/planning, since a given viewer might not be allowed to see them.
export type VisibleTravelStatus =
  | { kind: 'home' }
  | { kind: 'traveling'; country: string; city?: string; until?: string }
  | { kind: 'planning'; country: string; city?: string; month?: string };

export type TravelGoal = {
  year: number;
  metric: 'countries' | 'cities' | 'places';
  target: number; // progress is calculated from reviews, not stored
};
