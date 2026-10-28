import { Place } from './place';

export type Collection = {
    id : string;
    name : string;
    place: Place[]; // an array of the saved places
    country?: string; // would also be auto generated based on the places in the collection
    collection?: Collection[]; // allowing for sub collections, ex. Europe Trip could have a sub collection of France; I'm not sure this is correct
    // need to figure out how to limit the depth of sub-collections, so there aren't infinate collections within collections//
    /* the idea of this is that saved places automatically get added to collections 
    based on their location, but this will have to be implemented in the backend*/

}   

