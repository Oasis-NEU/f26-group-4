// Template for new types. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. place.ts
// 2. Rename TemplateType, e.g. Place
// 3. Replace the example fields with the data your type needs
// 4. Use it anywhere: import { Place } from '@/types/place';

import { Review } from "./review";
import {Media} from "../../types";

export type Place = {
    id: string; // text // for database?
    name: string; // text
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
    coverImage: string; // the cover image for the place, I'm not sure how this would be selected
    description?: string; // optional field (the ? means it can be left out; aka can be left undefined)
    reviews?: Review[]; //
    proximity: number; // how far away the place is from the user, in meters
    // A field can also be another type, e.g. `author: User;` (import `User` at the top of the file first)
};

export const mockPlace: Place = {
    id: "place_001",
    name: "Mountain Peak Café",
    averageRating: 4.6,
    friendsRating: 4.8,
    isVerified: true,
    suitedFor: ["solo", "skiers", "remote work"],
    placeType: "cafe",
    bookmark: false,
    addToList: false,
    address: "123 Alpine Road, Chamonix",
    city: "Chamonix",
    country: "France",
    website: "https://example.com/mountain-peak-cafe",
    directions: "https://maps.google.com/?q=123+Alpine+Road+Chamonix",
    media: [
        { type: "photo", url: "https://picsum.photos/800/600", caption: "View from the terrace" },
        { type: "video", url: "https://example.com/tour.mp4" },
    ],
    coverImage: "https://picsum.photos/800/600",
    description: "A cozy café at the base of the slopes with great coffee and a view of Mont Blanc.",
    reviews: [],
    proximity: 850,
};
