// A user's profile: who they are, where they live/travel, and their posts.
// Used by the Profile Page.
// See src/types/template-type.ts if you want to see how a type file is put together.

export type Profile = {
  id: string; // User ID; uniquely identifies this profile (the "key")
  name: string;
  username: string;
  profilePicture: string; // URL to the image
  bio?: string; // short description shown next to the avatar (optional)
  homeCountry: string; // 2-letter country code, e.g. "US"; their "home base"
  currentCountry: string; // 2-letter country code, e.g. "FR"; used to generate a flag emoji
  interests: string[]; // hobbies/interests, e.g. ["hiking", "photography"]
  friendIds: string[]; // IDs of this user's friends; used to suggest new friends
  postIds: string[]; // IDs of the reviews/posts they've made (their "places traveled/rated")
};