// Upload's form check: which fields still need something before a post can be saved.
// It never touches the database, so it lives here rather than in src/services/.
import type { UploadFields } from '@/types/upload-fields';

export type PostErrors = Partial<Record<keyof UploadFields, string>>;

export function validatePost(fields: UploadFields): PostErrors {
  const errors: PostErrors = {};

  if (!fields.media.some((item) => item.type === 'photo')) {
    errors.media = 'Add at least one photo.';
  }

  if (!fields.placeName.trim()) {
    errors.placeName = 'Enter a place name.';
  }

  if (!fields.city.trim()) {
    errors.city = 'Enter a city.';
  }

  if (!fields.country.trim()) {
    errors.country = 'Enter a country.';
  }

  if (fields.rating < 1 || fields.rating > 5) {
    errors.rating = 'Choose a rating from 1 to 5 stars.';
  }

  if (!fields.reviewText.trim()) {
    errors.reviewText = 'Write a short review.';
  }

  if (!fields.placeType) {
    errors.placeType = 'Choose a place type.';
  }

  return errors;
}
