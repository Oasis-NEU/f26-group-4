// Template for new types. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. place.ts
// 2. Rename TemplateType, e.g. Place
// 3. Replace the example fields with the data your type needs
// 4. Use it anywhere: import { Place } from '@/types/place';

import {Media} from "../../types"; // type has not been created yet

export type Review = {
    id: string; // text; for identification purposes
    profileName: string; // the name of the user who wrote the review
    placeID: string; // the ID of the place being reviewed so that it can be linked ; but I don't know how to do that yet
    rating: 1 | 2 | 3 | 4 | 5; // max 5
    placeType: string; // e.g. "cafe", "excursion", "sport", etc
    reviewText?: string; // the written review
    isVerified: boolean; // `true` or `false`
    suitedFor?: string[]; // these would be selected options though
    address: string; // a string ; I think we should do geotag here, I'm not sure how to do that yet
    city: string; // for display purposes, and so we can filter by city; this should generate based on the location of the place, but I'm not sure how to do that yet
    country: string; // ^
    website?: string; // e.g. the reservation link for a restaurant, or the booking link for an excursion
    media: Media[]
    // tagFriends: string[];
    // visitDate: string; // would have to have an option to keep it private
};
