// A few real photos for a city, for the "Dream trip" cover option
// (edit-cover-panel.tsx). Calls the destination-photo Edge Function, which
// holds the Pixabay API key server-side -- the app never sees it, only the
// photo URLs it hands back.

import { supabase } from '@/lib/supabase';

export async function getDestinationPhotos(cityId: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('destination-photo', { body: { cityId } });
  if (error) throw error;
  return (data as { photos?: string[] } | null)?.photos ?? [];
}
