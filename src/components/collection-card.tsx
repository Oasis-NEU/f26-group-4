import { CollectionTile } from '@/components/ui';
import { Collection } from '@/types/collection';
import { getCountryFlag } from '@/utils/country-flags';

// One collection shown as a card, e.g. "Europe Trip".
// The look of the tile lives in src/components/ui/collection-tile.tsx -- this
// file just works out WHAT to show on it from a Collection.

type CollectionCardProps = {
  collection: Collection;
  index?: number; // position in the list, so each tile gets a different gradient
  onPress?: () => void;
};

export function CollectionCard({ collection, index = 0, onPress }: CollectionCardProps) {
  // Count the places in this collection plus any inside its sub-collections,
  // so "Europe Trip" shows 4 rather than 0.
  let placeCount = collection.places.length;

  if (collection.subCollections !== undefined) {
    for (const sub of collection.subCollections) {
      placeCount = placeCount + sub.places.length;
    }
  }

  // "4 places", and the country after it when we know one.
  let details = placeCount + (placeCount === 1 ? ' place' : ' places');

  if (collection.country !== undefined) {
    details = details + ' · ' + collection.country;
  }

  // TODO: collections should store their own emoji that the person picks when
  // they make one -- a "Coffee Shops" collection wants ☕, and there's no way
  // to work that out from the name. Using the country flag for now because
  // that's the one thing we actually know.
  const emoji = collection.country !== undefined ? getCountryFlag(collection.country) : '';

  return (
    <CollectionTile
      name={collection.name}
      details={details}
      index={index}
      emoji={emoji !== '' ? emoji : undefined}
      image={collection.coverImage}
      onPress={onPress}
    />
  );
}
