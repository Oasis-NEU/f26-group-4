// Stands in for Supabase until it's set up. It waits a moment like a real network request
// (so you can see loading states), then hands back the data.
// Mock data lives in memory, so anything added is gone when the app reloads.
// Delete this file once every service uses Supabase.
export function mockRequest<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 300));
}
