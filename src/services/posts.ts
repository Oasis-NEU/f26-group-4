// Upload's post: a review of a place, with photos. createPost uploads the
// photos, then saves everything with the create_review() database function,
// which adds the city and place if they're new and updates your review if
// you've posted about the place before (one review per person per place).

import { supabase } from '@/lib/supabase';

import { deleteMedia, uploadMedia } from './media';

import { validatePost } from '@/utils/validate-post';

import type { UploadFields } from '@/types/upload-fields';

export type SavedPost = UploadFields & {
  id: string; // the place's id, so Upload can open the place afterwards
  createdAt: string;
};

export async function createPost(fields: UploadFields): Promise<SavedPost> {
  if (Object.keys(validatePost(fields)).length > 0) {
    throw new Error('Please complete the required fields.');
  }

  // Photos only for now (docs/backend-plan.md, open decision 6).
  const photos = fields.media.filter((item) => item.type === 'photo');
  const uploaded: string[] = [];

  try {
    for (const photo of photos) {
      uploaded.push(await uploadMedia(photo.url, 'reviews'));
    }

    const { data: placeId, error } = await supabase.rpc('create_review', {
      post: {
        place_id: fields.placeId ?? null,
        place_name: fields.placeName.trim(),
        address: fields.address.trim(),
        city: fields.city.trim(),
        country: fields.country.trim(),
        latitude: fields.latitude ?? null,
        longitude: fields.longitude ?? null,
        place_type: fields.placeType,
        suited_for: fields.suitedFor,
        rating: fields.rating,
        body: fields.reviewText.trim(),
        media: uploaded.map((path, index) => ({ path, caption: (photos[index].caption ?? '').trim() })),
      },
    });
    if (error) throw error;

    return { ...fields, id: placeId, createdAt: new Date().toISOString() };
  } catch (error) {
    // Don't leave the photos behind if the post wasn't saved.
    await deleteMedia(uploaded).catch(() => {});
    throw error;
  }
}
