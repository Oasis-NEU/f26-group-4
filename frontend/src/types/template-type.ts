// Template for new types. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. place.ts
// 2. Rename TemplateType, e.g. Place
// 3. Replace the example fields with the data your type needs
// 4. Use it anywhere: import { Place } from '@/types/place';

export type TemplateType = {
  id: string; // text
  rating: number; // a number, e.g. 4.5
  isVerified: boolean; // `true` or `false`
  tags: string[]; // a list of strings
  mediaType: 'photo' | 'video'; // must be one of these exact values (here they're strings but can enumerate many types)
  description?: string; // optional field (the ? means it can be left out; aka can be left undefined)
  // A field can also be another type, e.g. `author: User;` (import `User` at the top of the file first)
};
