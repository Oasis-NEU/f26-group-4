// Collections inside collections: how deep one sits, what the ones above it
// say, and whether a place gets past all of them.
//
// Plain functions, no network. They work on the tree getCollections() hands
// back -- each collection with its subCollections inside -- so the New
// collection screen, the collection page and auto add (savePlace() in
// src/services/collections.ts) all work it out the same way.

import { describeRulesAsLimit, isEmptyRules, matchesRules } from './collection-rules';

import type { Collection, CollectionRules } from '@/types/collection';
import type { Place } from '@/types/place';

// How deep collections can nest. "Europe Trip" > "France" > "Paris" is three
// levels and is allowed; a fourth isn't. Nesting forever makes the back button
// miserable and the cards impossible to lay out. The database keeps the same
// limit (private.check_collection_nesting), so this only decides what the app
// offers -- like whether the + inside a collection shows.
export const MAX_COLLECTION_DEPTH = 3;

// One collection from the tree, with where it sits.
export type NestedCollection = {
  collection: Collection;
  depth: number; // 1 for a top-level collection
  ancestors: Collection[]; // the collections above it: its parent first, then that one's parent
};

// Every collection in the tree in one flat list, each with the collections
// above it. A collection comes before the ones inside it.
export function flattenCollections(tree: Collection[]): NestedCollection[] {
  const flat: NestedCollection[] = [];

  // Adds one collection, then everything inside it. It calls itself for the
  // sub-collections, which is how it gets down all three levels.
  function add(collection: Collection, ancestors: Collection[]) {
    flat.push({ collection, depth: ancestors.length + 1, ancestors });

    for (const sub of collection.subCollections ?? []) {
      add(sub, [collection, ...ancestors]);
    }
  }

  for (const top of tree) {
    add(top, []);
  }

  return flat;
}

function findNested(tree: Collection[], id: string): NestedCollection | undefined {
  return flattenCollections(tree).find((nested) => nested.collection.id === id);
}

// How deep a collection sits: 1 at the top level. 0 when it isn't in the tree.
export function collectionDepth(tree: Collection[], id: string): number {
  return findNested(tree, id)?.depth ?? 0;
}

// Can this collection hold another one inside it, or is it already at the
// bottom of the nesting limit? The + inside a collection hides itself rather
// than letting someone tap it and get an error.
export function canHoldSubCollection(tree: Collection[], id: string): boolean {
  const depth = collectionDepth(tree, id);
  return depth > 0 && depth < MAX_COLLECTION_DEPTH;
}

// The rules out of a list of collections, skipping the ones that have none.
export function rulesOf(collections: Collection[]): CollectionRules[] {
  const rules: CollectionRules[] = [];

  for (const collection of collections) {
    if (collection.rules !== undefined && !isEmptyRules(collection.rules)) {
      rules.push(collection.rules);
    }
  }

  return rules;
}

// The rules of the collection a new one goes inside, then of the ones above
// that. Empty for a top-level collection.
//
// A sub-collection is NARROWED BY the one it sits in, rather than starting
// with a copy of its rules. "Europe Trip > France > Paris" means a place has
// to match Europe AND France AND Paris -- which is what the nesting looks like
// it means.
//
// It was the other way round at first: a new sub-collection started with its
// parent's rules already filled in. That turned out badly. Making "Paris"
// inside "France" started with "anywhere in France", and because everything
// about WHERE is an either/or (see src/lib/collection-rules.ts), adding the
// city Paris on top read as "France OR Paris" -- so the Paris collection
// hoovered up every French place. Narrowing can't go wrong that way.
export function rulesAbove(tree: Collection[], parentId: string | undefined): CollectionRules[] {
  if (parentId === undefined) {
    return [];
  }

  const parent = findNested(tree, parentId);

  if (parent === undefined) {
    return [];
  }

  return rulesOf([parent.collection, ...parent.ancestors]);
}

// What the collections above limit a sub-collection to, as a phrase the
// screen can drop into a sentence: "in France and in Europe". Empty when
// nothing above it has any rules.
export function describeLimits(ancestorRules: CollectionRules[]): string {
  const parts: string[] = [];

  for (const rules of ancestorRules) {
    const phrase = describeRulesAsLimit(rules);

    if (phrase !== '') {
      parts.push(phrase);
    }
  }

  return parts.join(' and ');
}

// Does a place match these rules AND every rule set above them?
export function matchesWithAncestors(
  place: Place,
  rules: CollectionRules | undefined,
  ancestorRules: CollectionRules[],
): boolean {
  if (!matchesRules(place, rules)) {
    return false;
  }

  for (const ancestor of ancestorRules) {
    if (!matchesRules(place, ancestor)) {
      return false;
    }
  }

  return true;
}

// Every place in a collection and the ones inside it, each place once. A
// parent shows everything inside its children, so "Europe Trip" counts the
// places in France and in Paris too.
export function everyPlaceIn(collection: Collection): Place[] {
  const seenIds = new Set<string>();
  const places: Place[] = [];

  function addFrom(current: Collection) {
    for (const place of current.places) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        places.push(place);
      }
    }

    for (const sub of current.subCollections ?? []) {
      addFrom(sub);
    }
  }

  addFrom(collection);
  return places;
}
