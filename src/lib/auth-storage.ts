// Where the sign-in session is kept on the web: the browser's own localStorage.
// iOS and Android use auth-storage.native.ts.
export const authStorage: Storage | undefined = typeof window === 'undefined' ? undefined : window.localStorage;
