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
                        // with no reviews can't have one yet. The demo data has hand-written
                        // ones; an Edge Function will write them later (docs/backend-plan.md).
    reviews?: Review[]; //
    // Where the place is, so the Map can pin it. Optional: a place posted without a
    // location just stays off the map.
    latitude?: number;
    longitude?: number;
    // How far away the place is from the phone, in meters. It depends on where the
    // phone is, so it can't come from the database; nothing fills it in yet.
    proximity?: number;
};
