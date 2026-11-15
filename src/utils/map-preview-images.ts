import type { Place } from '@/types/place';

// Picks the photos for a place's map marker: photos your friends posted come first,
// then everyone else's, then the place's own photos, then its cover image.
// Returns at most `max` distinct image URLs.

export function getMapPreviewImages(place: Place, friendUsernames: string[], max = 3): string[] {
  const reviews = place.reviews ?? [];
  const photosOf = (list: typeof reviews) =>
    list.flatMap((review) => review.media.filter((m) => m.type === 'photo').map((m) => m.url));

  const friendPhotos = photosOf(reviews.filter((r) => friendUsernames.includes(r.profileName)));
  const otherPhotos = photosOf(reviews.filter((r) => !friendUsernames.includes(r.profileName)));
  const placePhotos = place.media.filter((m) => m.type === 'photo').map((m) => m.url);

  // Empty URLs are placeholders in the sample data; Set drops repeats
  const all = [...friendPhotos, ...otherPhotos, ...placePhotos, place.coverImage].filter(Boolean);
  return [...new Set(all)].slice(0, max);
}
