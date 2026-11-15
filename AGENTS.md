This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Data, auth & Supabase

The app talks to the team's shared Supabase project. `.env` (committed) holds its URL and publishable key, so app work needs no setup: no Docker, no Supabase CLI, no Supabase account. Don't install Docker or run Supabase CLI commands that touch a database (`supabase start`, `link`, `db push`, `db reset`, `seed`) unless the user says they're doing database work on the local stack. The README's "The backend (Supabase)" section has the setup.

Before writing code that loads or saves data, signs people in, or touches Supabase, read `docs/data-layer.md`. It sets where state lives (React Query hooks over `src/services/`, context only for the session), the service and hook names to build against, and which phase is already built. Screens and components call hooks from `src/hooks/`, never services, and only files in `src/services/` (and `src/hooks/use-session.tsx`) import the Supabase client. Lint enforces both: if a screen needs data no hook gives, add the service function and a hook for it.

Changing the database (a table, column, privacy rule, function, storage or demo data) is the tech lead's job. If a feature needs one, write it as a new migration for them to review and push (`npx supabase migration new <what-changed>` only creates the file in `supabase/migrations/`; it needs no Docker or login), and read `docs/backend-plan.md` first, especially "Writing migrations": every new table needs RLS, policies and grants, and functions that skip RLS live in the `private` schema. Never edit a migration that's already been pushed, and never put the secret key or database password in the app or in any `.env`.

For database work on the local stack (needs Docker Desktop running):

```bash
npx supabase start        # local Supabase in Docker
npm run demo:reset        # rebuild the demo accounts and data on the local stack
npx supabase test db      # the database tests in supabase/tests/
npx supabase db advisors  # Supabase's security and performance checks
npx supabase gen types --schema public > src/types/database.ts  # after a schema change
```

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
