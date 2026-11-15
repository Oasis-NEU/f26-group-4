// A collection is a group of saved places, e.g. "Europe Trip" or "Coffee Shops".
// A collection can also hold smaller collections inside it, e.g. "Europe Trip"
// could contain "France", which could contain "Paris".

import { Place } from './place';

// What a collection is "about". Every field is optional -- a collection with no
// rules at all is just a plain folder you put places in by hand.
//
// HOW THEY COMBINE: everything you pick inside one group is an OR, and the
// groups are ANDed together. So:
//
//   { placeTypes: ['bar', 'cafe'], countries: ['Japan'] }
//     = "a bar OR a cafe, AND in Japan"   -> "Bars · Cafes in Japan"
//
//   { regions: ['Europe'] }
//     = "anywhere in Europe"
//
// That covers the three cases we wanted (a region, a kind of place, or both)
// without an all/any switch for people to get wrong.
export type CollectionRules = {
  regions?: string[]; // 'Europe', 'South America' -- see src/lib/regions.ts
  countries?: string[]; // 'France', 'Japan'
  cities?: string[]; // 'Paris', 'Florence'
  placeTypes?: string[]; // 'cafe', 'restaurant' -- matches Place.placeType
  vibes?: string[]; // 'adventure', 'solo' -- matches Place.suitedFor
};

export type Collection = {
    id: string;
    name: string;
    places: Place[]; // the saved places in this collection
    country?: string; // auto-generated from the places inside; a trip like "Europe" won't have one
    coverImage?: string; // the picture on the card; if missing, use the first place's image
    ownerId?: string; // which user this collection belongs to; optional until login works
    isPrivate?: boolean; // hidden from anyone except the owner, e.g. on their profile
    isAuto?: boolean; // the APP made this collection (one per city), vs. the user making it.
                      // Not the same as autoAdd below: a collection the user made by hand can
                      // still fill itself up.
    parentId?: string; // the collection this one sits inside. Missing means top level.
                       // `subCollections` is the same relationship the other way round, built
                       // by the service for screens to read.
    subCollections?: Collection[]; // sub collections, e.g. "Europe Trip" -> "France" -> "Paris"
                                   // Nesting is capped at MAX_COLLECTION_DEPTH levels
                                   // (see src/services/collections.ts), so Europe > France >
                                   // Paris is allowed and a fourth level isn't.

    // --- Auto add ---
    rules?: CollectionRules; // what belongs in here
    autoAdd?: boolean; // when true, saving a place that matches `rules` drops it in here
                       // automatically. Per collection, not per user -- the rules live here,
                       // so the switch does too. A place that matches two collections goes in
                       // both.
    excludedPlaceIds?: string[]; // places the user took OUT by hand. Auto add skips these, so
                                 // something you removed doesn't come straight back.
};
