// Working out whether a place belongs in a collection.
//
// These are plain functions -- no network, no user. The New collection screen
// uses them to show a preview ("3 of your saved places match"), and
// collections.ts uses the same ones when a place gets saved. Because it's the
// same code, the preview can never disagree with what actually happens.
//
// THE MATCHING RULE
//
// There are three groups. A place has to pass every group that's been filled
// in. Inside a group, matching any one thing is enough:
//
//   1. WHERE   regions + countries + cities, all in one group together.
//              They're all answers to "where", so picking "Europe" and "Japan"
//              means "Europe OR Japan" -- not both at once, which nothing
//              could ever match.
//   2. TYPE    placeTypes -- cafe, restaurant, excursion.
//   3. VIBE    vibes -- matches Place.suitedFor, e.g. adventure, solo.
//
// So { placeTypes: ['bar'], countries: ['Japan'] } is "bars in Japan".
//
// A collection with NO rules matches nothing. That's on purpose: an empty rule
// set means "I'll add places myself", not "add everything I save".

import { isCountryInRegion } from './regions';

import { CollectionRules } from '@/types/collection';
import { Place } from '@/types/place';

// Compares two names ignoring capitals and spaces, so "cafe" matches "Cafe".
function sameName(first: string, second: string): boolean {
  return first.trim().toLowerCase() === second.trim().toLowerCase();
}

// Every field on CollectionRules is optional, so this saves writing
// `rules.regions === undefined || rules.regions.length === 0` everywhere.
function listOrEmpty(list: string[] | undefined): string[] {
  if (list === undefined) {
    return [];
  }

  return list;
}

// Has the user picked anything at all?
export function isEmptyRules(rules: CollectionRules | undefined): boolean {
  if (rules === undefined) {
    return true;
  }

  const total =
    listOrEmpty(rules.regions).length +
    listOrEmpty(rules.countries).length +
    listOrEmpty(rules.cities).length +
    listOrEmpty(rules.placeTypes).length +
    listOrEmpty(rules.vibes).length;

  return total === 0;
}

// Group 1: where the place is.
function matchesWhere(place: Place, rules: CollectionRules): boolean {
  const regions = listOrEmpty(rules.regions);
  const countries = listOrEmpty(rules.countries);
  const cities = listOrEmpty(rules.cities);

  // Nothing picked about location, so location doesn't rule anything out.
  if (regions.length === 0 && countries.length === 0 && cities.length === 0) {
    return true;
  }

  for (const region of regions) {
    if (isCountryInRegion(place.country, region)) {
      return true;
    }
  }

  for (const country of countries) {
    if (sameName(country, place.country)) {
      return true;
    }
  }

  for (const city of cities) {
    if (sameName(city, place.city)) {
      return true;
    }
  }

  return false;
}

// Group 2: what kind of place it is.
function matchesType(place: Place, rules: CollectionRules): boolean {
  const placeTypes = listOrEmpty(rules.placeTypes);

  if (placeTypes.length === 0) {
    return true;
  }

  for (const placeType of placeTypes) {
    if (sameName(placeType, place.placeType)) {
      return true;
    }
  }

  return false;
}

// Group 3: who or what the place suits.
function matchesVibe(place: Place, rules: CollectionRules): boolean {
  const vibes = listOrEmpty(rules.vibes);

  if (vibes.length === 0) {
    return true;
  }

  for (const vibe of vibes) {
    for (const tag of place.suitedFor) {
      if (sameName(vibe, tag)) {
        return true;
      }
    }
  }

  return false;
}

// Does this place belong in a collection with these rules?
export function matchesRules(place: Place, rules: CollectionRules | undefined): boolean {
  // No rules means nothing matches automatically -- see the note at the top.
  if (rules === undefined || isEmptyRules(rules)) {
    return false;
  }

  if (!matchesWhere(place, rules)) {
    return false;
  }

  if (!matchesType(place, rules)) {
    return false;
  }

  if (!matchesVibe(place, rules)) {
    return false;
  }

  return true;
}

// Turns "cafe" into "Cafe" for showing on screen.
function capitalise(word: string): string {
  if (word.length === 0) {
    return word;
  }

  return word[0].toUpperCase() + word.slice(1);
}

// The rules written out as a sentence, to show under the collection's name:
// "Cafes · Bars in Japan", "Anything in Europe".
// Gives back an empty string when there are no rules, so the caller can hide
// the line instead of showing a blank one.
export function describeRules(rules: CollectionRules | undefined): string {
  if (rules === undefined || isEmptyRules(rules)) {
    return '';
  }

  // WHAT: the kinds of place first, then the vibes.
  const what: string[] = [];

  for (const placeType of listOrEmpty(rules.placeTypes)) {
    // "cafe" -> "Cafes", because the collection holds more than one of them.
    // Only the kinds of place get an s: "Adventures anywhere" would read oddly.
    what.push(capitalise(placeType) + (placeType.endsWith('s') ? '' : 's'));
  }

  for (const vibe of listOrEmpty(rules.vibes)) {
    what.push(capitalise(vibe));
  }

  // WHERE: biggest first, so "Europe · Paris" reads the way people say it.
  const where: string[] = [];

  for (const region of listOrEmpty(rules.regions)) {
    where.push(region);
  }

  for (const country of listOrEmpty(rules.countries)) {
    where.push(country);
  }

  for (const city of listOrEmpty(rules.cities)) {
    where.push(city);
  }

  if (what.length > 0 && where.length > 0) {
    return what.join(' · ') + ' in ' + where.join(' · ');
  }

  if (what.length > 0) {
    return what.join(' · ') + ' anywhere';
  }

  return 'Anything in ' + where.join(' · ');
}

// The same rules written as a LIMIT rather than a description, for the line on
// the New collection screen that says what a sub-collection is narrowed to.
//
// describeRules gives "Anything in France" and "Cafes in Japan", which read
// fine as a heading but badly in a sentence. This gives "in France" and "that
// are Cafes in Japan", so the screen can say "Only places in France can land
// in here."
export function describeRulesAsLimit(rules: CollectionRules | undefined): string {
  const sentence = describeRules(rules);

  if (sentence === '') {
    return '';
  }

  // "Anything in France" -> "in France"
  if (sentence.startsWith('Anything in ')) {
    return sentence.replace('Anything in ', 'in ');
  }

  // "Cafes anywhere" -> "that are Cafes", since "anywhere" adds nothing here.
  if (sentence.endsWith(' anywhere')) {
    return 'that are ' + sentence.replace(' anywhere', '');
  }

  // "Cafes in Japan" -> "that are Cafes in Japan"
  return 'that are ' + sentence;
}
