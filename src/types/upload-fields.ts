import type { Media } from '@/types/media';

// Information entered on the upload page.
export type UploadFields = {
  // Set when selecting an existing place.
  // Left out when adding a new place.
  placeId?: string;

  // The place's name and location.
  placeName: string;
  address: string;
  city: string;
  country: string;

  // 0 means no rating selected yet.
  rating: 0 | 1 | 2 | 3 | 4 | 5;

  // The person's written review.
  reviewText: string;

  // Selected photos and their captions.
  media: Media[];

  // One category, such as "cafe".
  placeType: string;

  // Multiple tags, such as "solo" and "adventure".
  suitedFor: string[];
};