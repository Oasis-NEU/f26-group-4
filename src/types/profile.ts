// A user's profile: who they are, where they live/travel, and their posts.
// Used by the Profile Page.
// See src/types/template-type.ts if you want to see how a type file is put together.

export type Profile = {
  id: string; // User ID; uniquely identifies this profile (the "key")
  name: string;
  username: string;
  profilePicture: string; // URL to the image
  homeCountry: string; // where they live, their "home base"
  currentCountry: string; // where they're currently traveling; used to generate a flag emoji
  interests: string[]; // hobbies/interests, e.g. ["hiking", "photography"]
  postIds: string[]; // IDs of the reviews/posts they've made (their "places traveled/rated")
};
