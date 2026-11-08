// A single place in the app: a cafe, a ski run, an excursion, etc.
// Used by the Place details page and by anything that lists places.

import { Media } from "./media";
import { Review } from "./review";

export type Place = {
    id: string; // text // for database?
    name: string; // text
    averageRating: number; // the number would need to be maxed at 5, but I don't know how to do that yet
    friendsRating?: number; // same as above, but this is the average rating of the user's friends
    algorithmRating?: number; // this number would be the recommendation of an algorithm based on the user's preferences, but I don't know how to do that yet
    isVerified: boolean; // `true` or `false`
    suitedFor: string[]; // a list of strings e.g. "solo", "adventure", "skiiers", etc
    placeType: string; // e.g. "cafe", "excursion", "sport", etc
    bookmark: boolean; // "bookmarked" and "saved" mean the same thing -- one tap puts the
                       // place on the Saved page.
                       // TODO: the team plan (docs/pages/README.md) says to remove this.
    addToList: boolean; // TODO: and this. Whether a place is saved depends on WHO is signed in,
                        // so it belongs in collections, not on the place itself. Ask the team first.
    address: string; // a string ; I think we should do geotag here, I'm not sure how to do that yet
    city: string; // for display purposes, and so we can filter by city; this should generate based on the location of the place, but I'm not sure how to do that yet
    country: string; // ^
    website?: string; // e.g. the reservation link for a restaurant, or the booking link for an excursion
    directions: string; // would open in maps, but this may need to become its own component (?)
    coverImage: string; // the main image shown at the top of the place page
    media: Media[]; // all the other photos/videos for this place
    description?: string; // optional field (the ? means it can be left out; aka can be left undefined)
    aiSummary?: string; // a short summary written from the reviews. Optional because a place
                        // with no reviews can't have one yet.
                        // TODO: nothing generates this yet -- the mock data just has it typed in
                        // by hand. Needs a backend that reads the reviews and writes a summary.
    reviews?: Review[]; //
    latitude: number; // where the place is, so the Map can pin it
    longitude: number;
    proximity: number; // how far away the place is from the user, in meters
};

// Sample data so the app has something to show before Supabase exists
// The rest of the sample places live in src/services/places.ts
export const mockPlace: Place = {
    id: "place_001",
    name: "Mountain Peak Café",
    averageRating: 4.6,
    friendsRating: 4.8,
    algorithmRating: 4.2,
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
    coverImage: "https://picsum.photos/id/1018/800/600",
    media: [
        { type: "photo", url: "https://picsum.photos/id/1015/800/600", caption: "View from the terrace" },
        { type: "photo", url: "https://picsum.photos/id/1016/800/600", caption: "The coffee bar" },
        { type: "video", url: "https://example.com/tour.mp4" },
    ],
    description: "A cozy café at the base of the slopes with great coffee and a view of Mont Blanc.",
    aiSummary: "Visitors keep mentioning the view and the coffee. It gets busy right after the lifts open, so most people suggest going early.",
    reviews: [
        {
            id: "review_001",
            profileName: "mara_k",
            placeID: "place_001",
            rating: 5,
            placeType: "cafe",
            reviewText: "Got here at 8 and had the terrace to myself. The view is the whole point.",
            isVerified: true,
            suitedFor: ["solo"],
            address: "123 Alpine Road, Chamonix",
            city: "Chamonix",
            country: "France",
            media: [{ type: "photo", url: "", caption: "Empty terrace" }],
            authorId: "u1", // Folake; so the Profile page has something to show
            createdAt: "2026-09-10",
        },
        {
            id: "review_002",
            profileName: "dgonzalez",
            placeID: "place_001",
            rating: 4,
            placeType: "cafe",
            reviewText: "Good wifi, worked here all afternoon. Loud around lunch.",
            isVerified: false,
            address: "123 Alpine Road, Chamonix",
            city: "Chamonix",
            country: "France",
            media: [],
        },
        {
            id: "review_003",
            profileName: "s.whitfield",
            placeID: "place_001",
            rating: 5,
            placeType: "cafe",
            reviewText: "Best pain au chocolat of the trip.",
            isVerified: true,
            address: "123 Alpine Road, Chamonix",
            city: "Chamonix",
            country: "France",
            media: [
                { type: "photo", url: "" },
                { type: "photo", url: "", caption: "The pastry case" },
            ],
        },
    ],
    latitude: 45.9237,
    longitude: 6.8694,
    proximity: 850,
};
