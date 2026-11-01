import type { Review } from './review';

export type Place = {
  // Unique ID for this place.
  id: string;

  name: string;
  averageRating: number;
  friendsRating?: number;
  isVerified: boolean;

  // Categories describing the place.
  suitedFor: string[];
  placeType: string;

  bookmark: boolean;
  addToList: boolean;

  // Written location information.
  address: string;
  city: string;
  country: string;

  // Map coordinates.
  // Optional for older data, but new-place posting will require them.
  latitude?: number;
  longitude?: number;

  website?: string;
  directions: string;

  // Existing fields used by your team's code.
  media: 'photo' | 'video';
  coverImage: 'photo';

  description?: string;
  reviews?: Review[];

  // Distance from the user, in meters.
  proximity: number;
};
