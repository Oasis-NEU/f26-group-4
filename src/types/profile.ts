// A user's profile: who they are, where they live/travel, and their posts.
// Used by the Profile Page.
// See src/types/template-type.ts if you want to see how a type file is put together.

export type Profile = {
  id: string; // User ID; uniquely identifies this profile (the "key")
  name: string;
  username: string;
  profilePicture?: string; // URL to the image; missing means show initials (see Avatar)
  bio?: string; // short description shown next to the avatar (optional)
  homeCountry: string; // 2-letter country code, e.g. "US"; their "home base"; used for the flag
  homeCity: string; // e.g. "Boston"; shown as "Lives in Boston 🇺🇸"
  coverImage?: string; // a cover photo the user picked; overrides the automatic one
  dreamTrip?: string; // city used for the cover photo when they're home
  status: TravelStatus; // home / traveling / planning; set by hand
  statusSharing: {
    // how much of their status other people can see
    closeFriends: StatusDetail;
    everyone: StatusDetail;
  };
  closeFriendIds: string[]; // IDs of their close friends, picked from their followers
  goals?: TravelGoal[]; // yearly travel goals; progress is calculated, not stored
  interests: string[]; // hobbies/interests, e.g. ["hiking", "photography"]
  // Who follows whom now lives in src/services/follows.ts as a `follows` table,
  // not on the profile itself (see getFollowerIds/getFollowingIds).
};

// Where the user is right now. Countries are 2-letter codes, e.g. "FR".
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
