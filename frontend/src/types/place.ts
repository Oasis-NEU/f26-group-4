// Template for new types. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. place.ts
// 2. Rename TemplateType, e.g. Place
// 3. Replace the example fields with the data your type needs
// 4. Use it anywhere: import { Place } from '@/types/place';

import { review } from "./review";

export type place = {
  id: string; // text
  averageRating: number; // the number would need to be maxed at 5, but I don't know how to do that yet
  friendsRating?: number; // same as above, but this is the average rating of the user's friends
  isVerified: boolean; // `true` or `false`
  suitedFor: string[]; // a list of strings e.g. "solo", "adventure", "skiiers", etc
  placeType: string; // e.g. "cafe", "excursion", "sport", etc
  bookmark: boolean; // 
  addToList: boolean; // e.g. to add to a specific trip 
  address: string; // a string ; I think we should do geotag here, I'm not sure how to do that yet
  city: string; // for display purposes, and so we can filter by city; this should generate based on the location of the place, but I'm not sure how to do that yet
  country: string; // ^
  website?: string; // e.g. the reservation link for a restaurant, or the booking link for an excursion
  directions: string; // would open in maps, but this may need to become its own component (?)
  mediaType: 'photo' | 'video'; // how to have multiple media? and captions per piece of media?
  description?: string; // optional field (the ? means it can be left out; aka can be left undefined)
  reviews?: review[]; // 
  // A field can also be another type, e.g. `author: User;` (import `User` at the top of the file first)
};