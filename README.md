# f26-group-4: Travel App

Oasis Fall 2026, Group 4. The project has two parts:

- **`frontend/`**: the app, built with [Expo](https://expo.dev) (React Native + TypeScript). One codebase runs on iOS, Android, and the web.
- **`backend/`**: a small [Node.js](https://nodejs.org/) server ([Express](https://expressjs.com/)) that stores data in a [SQLite](https://www.sqlite.org/) database file.

## Getting started

Install [Node.js](https://nodejs.org/) (the LTS version, 24 or newer). Then run the backend and the app in two separate terminals.

**Terminal 1: backend**

```bash
cd backend
```

```bash
npm install
```

```bash
npm run dev
```

To check it's running, open http://localhost:4000/health. It restarts by itself when you save a `.ts` file.

**Terminal 2: app**

```bash
cd frontend
```

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

To use your phone, it has to be on the same Wi-Fi as your computer. If your firewall asks whether Node can accept incoming connections, allow it. Campus Wi-Fi often blocks phones from reaching computers. If the app won't load or can't reach the backend, use the web version or a simulator, or connect your computer to your phone's hotspot.

## Project structure

```
frontend/                      The app (Expo)
  src/
    app/                       Screens. Every file in here is a page (file-based routing)
      _layout.tsx              Wraps every screen; navigation (stack, tabs) is set up here
      index.tsx                The first screen
    components/                Reusable pieces that screens are built from
      template-component.tsx   Copy this to make a new component
    types/                     What the app's data looks like, e.g. a Place or an Upload
      template-type.ts         Copy this to make a new type
    services/                  Code that talks to the backend
      api.ts                   The backend's address
  assets/                      Images, icons, fonts
  app.json                     App config: name, icons, splash screen
backend/                       The server (Node.js + SQLite)
  src/
    index.ts                   Starts the server; routes are registered here
    db.ts                      Opens the database
    schema.sql                 The database's tables
    routes/                    One file per kind of data, e.g. places.ts
      template-route.ts        Copy this to make new routes
  app.db                       The database itself (created when the server starts; not in git)
```

Only screens and `_layout.tsx` files go in `frontend/src/app/`. Everything else goes elsewhere in `frontend/src/`; add folders as you need them, e.g. `frontend/src/hooks/` for custom hooks.

## Adding a screen

Create a file in `frontend/src/app/`. Its path becomes the route:

| File in `src/app/` | Route        |
| ------------------ | ------------ |
| `index.tsx`        | `/`          |
| `profile.tsx`      | `/profile`   |
| `place/[id].tsx`   | `/place/123` |

Link to it with `<Link href="/profile">` from `expo-router`. See the [Expo Router docs](https://docs.expo.dev/router/introduction/).

## Adding a component

Copy `frontend/src/components/template-component.tsx`, rename the file and the component, and fill in its props. Import it with the `@/` shortcut, which points to `frontend/src/`:

```tsx
import { FeedItem } from '@/components/feed-item';
```

## Adding a type

A type lists the fields a piece of data has, like what makes up a Place or an Upload. Copy `frontend/src/types/template-type.ts`, rename the file and the type, and fill in its fields. Types are often used for component props:

```tsx
import { Place } from '@/types/place';

type PlaceCardProps = {
  place: Place;
};
```

## Adding data to the backend

1. **Table:** copy the template in `backend/src/schema.sql`, change the columns, and restart the backend. To change a table that already exists, delete `backend/app.db` first (this erases your local data).
2. **Routes:** copy `backend/src/routes/template-route.ts`, rename it (e.g. `places.ts`), and point its queries at your table.
3. **Register** the routes in `backend/src/index.ts`: `app.use('/places', placesRouter);`
4. **Try it:** open http://localhost:4000/places in your browser.

Backend imports need the `.ts` ending, e.g. `import { db } from '../db.ts';`

## Calling the backend from the app

Use `API_URL` rather than typing the address, so it also works on phones:

```tsx
import { API_URL } from '@/services/api';
import { Place } from '@/types/place';

const response = await fetch(`${API_URL}/places`);
const places: Place[] = await response.json();
```

Keep calls like this in `frontend/src/services/` (e.g. a `getPlaces()` function in `places.ts`), not in screens.

## Installing packages

- **Frontend:** use `npx expo install <package>` instead of `npm install <package>`. It picks the version that works with our Expo SDK. Don't run `npm audit fix --force`; it can install versions that break Expo.
- **Backend:** use `npm install <package>`.

## Before you push

In `frontend/`:

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

In `backend/`:

```bash
npm run typecheck
```

## Docs

- [Expo docs](https://docs.expo.dev/)
- [React Native components](https://reactnative.dev/docs/components-and-apis)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Express](https://expressjs.com/)
- [Node.js SQLite](https://nodejs.org/api/sqlite.html)
