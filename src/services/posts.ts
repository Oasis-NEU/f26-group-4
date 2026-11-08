import { mockRequest } from './mock-backend';
import type { UploadFields } from '@/types/upload-fields';

export type PostErrors = Partial<Record<keyof UploadFields, string>>;

export type SavedPost = UploadFields & {
  id: string;
  createdAt: string;
};

const posts: SavedPost[] = [];
let nextId = 1;

export function validatePost(fields: UploadFields): PostErrors {
  const errors: PostErrors = {};

  if (fields.media.length === 0) {
    errors.media = 'Add at least one photo or video.';
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

export async function createPost(
  fields: UploadFields
): Promise<SavedPost> {
  if (Object.keys(validatePost(fields)).length > 0) {
    throw new Error('Please complete the required fields.');
  }

  const post: SavedPost = {
    ...fields,
    placeName: fields.placeName.trim(),
    address: fields.address.trim(),
    city: fields.city.trim(),
    country: fields.country.trim(),
    reviewText: fields.reviewText.trim(),
    media: fields.media.map((item) => ({
      ...item,
      caption: (item.caption ?? '').trim(),
    })),
    suitedFor: [...fields.suitedFor],
    id: String(nextId++),
    createdAt: new Date().toISOString(),
  };

  // Replace this request with Supabase when the backend is ready.
  const saved = await mockRequest(post);
  posts.push(saved);

  return saved;
}