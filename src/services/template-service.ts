import { mockRequest } from './mock-backend';

import type { TemplateType } from '@/types/template-type';

// Template for new services. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. places.ts
// 2. Rename the functions and TemplateType, e.g. getPlaces, getPlace, createPlace, and Place
// 3. Replace the mock data with a few examples of your own
// Screens get their data by calling these functions. The data is mock (fake) for now; later each
// function's body becomes a Supabase query, and the screens calling it don't have to change.

// TypeScript checks that the mock data matches the type
const mockItems: TemplateType[] = [
  { id: '1', rating: 4.5, isVerified: true, tags: ['beach', 'family'], mediaType: 'photo' },
  { id: '2', rating: 3, isVerified: false, tags: [], mediaType: 'video', description: 'Optional text' },
];

// Every item
export async function getTemplateItems(): Promise<TemplateType[]> {
  return mockRequest(mockItems);
}

// One item by its id, or null if there isn't one
export async function getTemplateItem(id: string): Promise<TemplateType | null> {
  return mockRequest(mockItems.find((item) => item.id === id) ?? null);
}

// Adds an item and returns it with its new id.
// Omit<TemplateType, 'id'> means "a TemplateType without the id", since the backend picks the id.
export async function createTemplateItem(item: Omit<TemplateType, 'id'>): Promise<TemplateType> {
  const newItem = { ...item, id: String(mockItems.length + 1) };
  mockItems.push(newItem);
  return mockRequest(newItem);
}
