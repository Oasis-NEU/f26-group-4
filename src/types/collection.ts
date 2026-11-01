// A collection is a group of saved places, e.g. "Europe Trip" or "Coffee Shops".
// A collection can also hold smaller collections inside it, e.g. "Europe Trip"
// could contain "France" and "Italy".

import { Place } from './place';

export type Collection = {
    id: string;
    name: string;
    places: Place[]; // the saved places in this collection
    country?: string; // auto-generated from the places inside; a trip like "Europe" won't have one
    coverImage?: string; // the picture on the card; if missing, use the first place's image
    ownerId?: string; // which user this collection belongs to; optional until login works
    subCollections?: Collection[]; // sub collections, e.g. "Europe Trip" -> "France"
    // The type allows collections nested as deep as you like. TODO: make a way to limit depth
   
    /* the idea of this is that saved places automatically get added to collections
    based on their location, but this will have to be implemented in the backend*/
};
