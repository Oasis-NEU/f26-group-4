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
    _layout.tsx              Wraps every screen; navigation (stack, tabs) is set up here
    index.tsx                The first screen
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

## Adding a screen

Create a file in `src/app/`. Its path becomes the route:

| File in `src/app/` | Route        |
| ------------------ | ------------ |
| `index.tsx`        | `/`          |
| `profile.tsx`      | `/profile`   |
| `place/[id].tsx`   | `/place/123` |

Link to it with `<Link href="/profile">` from `expo-router`. See the [Expo Router docs](https://docs.expo.dev/router/introduction/).

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

## Getting data

Screens and components don't fetch data themselves; they call functions in `src/services/`. Copy `src/services/template-service.ts` to make one service per kind of data (e.g. `places.ts` with `getPlaces()`), and give it a few mock examples:

```tsx
import { getPlaces } from '@/services/places';

const places = await getPlaces();
```

When Supabase is set up, only the insides of the service functions change. Screens keep calling `getPlaces()` the same way.

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
