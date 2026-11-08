# f26-group-4: Travel App

Oasis Fall 2026, Group 4. Built with [Expo](https://expo.dev) (React Native + TypeScript), so one codebase runs on iOS, Android, and the web. The backend will be [Supabase](https://supabase.com); until it's set up, the app uses mock (fake) data.

## Getting started

You need [Node.js](https://nodejs.org/) (LTS). Install dependencies, then start the dev server:

```bash
npm install
```

```bash
npx expo start
```

Then open the app:

- **Your phone:** install [Expo Go](https://expo.dev/go) and scan the QR code in the terminal
- **Web:** press `w`
- **iOS simulator:** press `i` (Mac with Xcode only)
- **Android emulator:** press `a` (needs Android Studio)

If your phone can't connect (common on campus Wi-Fi), start with `npx expo start --tunnel` instead.

## Project structure

```
src/
  app/                       Screens. Every file in here is a page (file-based routing)
    _layout.tsx              Wraps every screen; lists the pages that open on top of the tabs
    (tabs)/                  The pages in the bottom tab bar
      _layout.tsx            The tab bar: which tabs there are, their titles and icons
      index.tsx              Feed tab (the first screen)
      search.tsx             Search tab
      map.tsx                Map tab
      profile.tsx            Profile tab
    place/[id].tsx           A place's page, e.g. /place/place_001
    login.tsx                Log in page
    create-account.tsx       Create account page
  components/                Reusable pieces that screens are built from
    template-component.tsx   Copy this to make a new component
  types/                     What the app's data looks like, e.g. a Place or an Upload
    template-type.ts         Copy this to make a new type
  services/                  Where screens get their data from
    template-service.ts      Copy this to make a new service
    mock-backend.ts          Pretends to be the backend until Supabase is set up
assets/                      Images, icons, fonts
app.json                     App config: name, icons, splash screen
```

Only screens and `_layout.tsx` files go in `src/app/`. Everything else goes elsewhere in `src/`; add folders as you need them, e.g. `src/hooks/` for custom hooks.

## Building your page

Each tab already has a placeholder page in `src/app/(tabs)/`. Open yours, replace the placeholder text with your page, and build it from the components listed in the comment at the top of the file.

## Adding a screen

Create a file in `src/app/`. Its path becomes the route. Folder names in parentheses, like `(tabs)`, group files without changing the route:

| File in `src/app/`     | Route        |
| ---------------------- | ------------ |
| `(tabs)/index.tsx`     | `/`          |
| `(tabs)/profile.tsx`   | `/profile`   |
| `place/[id].tsx`       | `/place/123` |

Link to it with `<Link href="/profile">` from `expo-router`. A screen outside `(tabs)/` opens on top of the tab bar with a back button; set its header title in `src/app/_layout.tsx`. See the [Expo Router docs](https://docs.expo.dev/router/introduction/).

To add a tab, put the file in `src/app/(tabs)/` and add a `Tabs.Screen` for it in `src/app/(tabs)/_layout.tsx`. Keep it to 5 tabs or fewer so they fit on a phone.

## Adding a component

Copy `src/components/template-component.tsx`, rename the file and the component, and fill in its props. Import it with the `@/` shortcut, which points to `src/`:

```tsx
import { FeedItem } from '@/components/feed-item';
```

## Adding a type

A type lists the fields a piece of data has, like what makes up a Place or an Upload. Copy `src/types/template-type.ts`, rename the file and the type, and fill in its fields. Types are often used for component props:

```tsx
import { Place } from '@/types/place';

type PlaceCardProps = {
  place: Place;
};
```

## The backend (Supabase)

The app's data lives in [Supabase](https://supabase.com): sign-in, the database and photos. [docs/backend-plan.md](docs/backend-plan.md) explains the tables, who can see what, and the demo data.

**Using the team's shared project.** `.env` holds its URL and publishable key (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). That key is meant to ship in the app; never put the secret key or database password in any `.env`.

**Running your own copy** (for database work, or to try things without touching the shared data). You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) running:

```bash
npx supabase start
```

Then make a `.env.local` (git ignores it) with the local URL and publishable key that `npx supabase status` prints, plus the demo sign-in settings:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from npx supabase status>
EXPO_PUBLIC_DEMO_LOGINS=true
EXPO_PUBLIC_DEMO_PASSWORD=<any password, 6+ characters>
```

Load the demo accounts and data, which also resets them whenever you want a clean slate:

```bash
npm run demo:reset
```

`.env.local` wins over `.env`; delete it to go back to the shared project. `npx supabase test db` runs the database tests.

**Native builds.** The app now uses `expo-sqlite` (keeps you signed in) and `expo-image-manipulator` (shrinks photos before upload). Both are native modules, so rebuild your development build once: `npx expo run:ios` or `npx expo run:android`. The web and Expo Go don't need this.

## Getting data

Screens and components don't fetch data themselves; they call functions in `src/services/`. Copy `src/services/template-service.ts` to make one service per kind of data (e.g. `places.ts` with `getPlaces()`), and give it a few mock examples:

```tsx
import { getPlaces } from '@/services/places';

const places = await getPlaces();
```

The services read and write Supabase now. A new service can start from the template's mock data, so you can build the screen first; once its tables exist, only the insides of its functions change, and screens keep calling it the same way.

Screens are moving to hooks in `src/hooks/` (e.g. `usePlaces()`), which call the services and keep every screen in sync. [docs/data-layer.md](docs/data-layer.md) has the rules, the function and hook names to use, and the Supabase plan.

## Installing packages

Use `npx expo install <package>` instead of `npm install <package>`. It picks the version that works with our Expo SDK. Don't run `npm audit fix --force`; it can install versions that break Expo.

## Before you push

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

## Docs

- [Expo docs](https://docs.expo.dev/)
- [React Native components](https://reactnative.dev/docs/components-and-apis)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase with Expo](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
