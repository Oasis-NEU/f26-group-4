// Photos in Supabase Storage. The database stores a photo's path inside the
// `media` bucket, never its full URL (docs/backend-plan.md, Storage).
// Paths look like <user id>/<folder>/<random>.jpg.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { currentUserId, supabase } from '@/lib/supabase';

const BUCKET = 'media';
const MAX_WIDTH = 1280;
const PUBLIC_URL_MARKER = `/storage/v1/object/public/${BUCKET}/`;

export type MediaFolder = 'avatar' | 'cover' | 'reviews';

// Something <Image> can show, from a path in the bucket or a full https URL
// (the demo data's placeholder photos). Missing paths give undefined.
export function getMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// The reverse of getMediaUrl, for a photo that comes back unchanged from an
// edit screen: our own public URL gives its path back, any other URL stays as it is.
export function mediaPathFrom(url: string): string {
  const at = url.indexOf(PUBLIC_URL_MARKER);
  return at === -1 ? url : decodeURIComponent(url.slice(at + PUBLIC_URL_MARKER.length));
}

// True for a photo that's still on the phone (picked, not uploaded yet).
export function isLocalPhoto(uri: string): boolean {
  return !/^https?:\/\//.test(uri);
}

// Shrinks a picked photo to 1280 px wide (if it's wider), saves it as a JPEG,
// uploads it into the signed-in user's folder, and returns its path. The
// picker hands back original files, which can be large HEICs, and Supabase only
// resizes images on paid plans.
export async function uploadMedia(localUri: string, folder: MediaFolder): Promise<string> {
  const userId = await currentUserId();

  let image = await ImageManipulator.manipulate(localUri).renderAsync();
  if (image.width > MAX_WIDTH) {
    image = await ImageManipulator.manipulate(localUri).resize({ width: MAX_WIDTH, height: null }).renderAsync();
  }
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  const bytes = await (await fetch(saved.uri)).arrayBuffer();

  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const path = `${userId}/${folder}/${name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

// Deletes uploaded photos. The database can't delete files itself, so services
// call this when a photo goes away. Full URLs (placeholders) are skipped.
export async function deleteMedia(paths: string[]): Promise<void> {
  const stored = paths.filter((path) => !/^https?:\/\//.test(path));
  if (stored.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(stored);
  if (error) throw error;
}
