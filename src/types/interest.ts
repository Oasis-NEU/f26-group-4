// A hobby/interest someone can pick for their profile, e.g. "Hiking" or a
// user-made one like "Rooftop bars". Used by sign-up and the Edit profile
// Interests panel.

export type Interest = {
  id: string;
  name: string; // "Rooftop bars"
  slug: string; // "rooftop-bars" -- lowercase, spaces to dashes; catches duplicates
  createdBy?: string; // user id who made it; missing for the starter list
  isStarter: boolean; // part of the built-in starter list vs. user-made
  userCount: number; // how many profiles have picked it
};
