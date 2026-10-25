# 1. Log in (and Create account)

![Log in sketch](sketches/login.jpg)

| | |
| - | - |
| **Route** | `/login` and `/create-account` |
| **Files** | `src/app/login.tsx`, `src/app/create-account.tsx` |
| **Navigator** | Root stack, in the signed-out group |
| **Status** | Both forms exist but aren't connected to anything |

## Where it sits in navigation

- **Reached from:** opening the app while signed out, or **Log out** on Profile.
- **Goes to:** Create account (link), and the Feed after signing in.
- Signing in doesn't need a `router.push`. Setting the session user flips the `Stack.Protected` guard, and the router moves to the tabs on its own (see [README](README.md#login-gate)).
- No back button. When you're signed out, this is the first screen.

## Sketch → what we build

| Sketch | Build |
| ------ | ----- |
| "Log In" title | App name and a "Log in" title |
| First box | Username (`AuthInput`, already there) |
| Second box | Password (`AuthInput` with `isPassword`, already there) |
| Small button labelled "create account" | Link to `/create-account`, already there. Keep the **Log in** button above it. |
| *(not in sketch)* | **Demo users** section, described below |

### Demo users

Under the form, add a "Demo: continue as" heading and one button per mock user, showing their avatar, name, and a one-line description. Tapping one calls `signInAsMockUser(id)`, so there's nothing to type during a demo.

Suggested demo users. Give each one different data so switching users changes what you see:

- A solo backpacker who's in a different country from their home country, with lots of reviews.
- A skier with a "Ski trips" collection.
- A brand-new user with no reviews or collections, to show the empty states.

## Behaviour

- **Log in:** the existing checks stay. Then call `signIn(username, password)` against `mockUsers`, and show "Wrong username or password" if it fails. Disable the button while the request runs (`mockRequest` waits 300 ms).
- **Create account:** the existing checks stay (all fields filled, passwords match). Then add the user to the in-memory `mockUsers` and sign them in. Also check that the username isn't already taken.
- **Log out** (on Profile): `signOut()` clears the user, and the guard sends you back here.

## Data

- `User` (`src/types/user.ts`), `LoginFields`, and `CreateAccountFields` already exist.
- `mockUsers` goes in `src/services/users.ts`. Mock users need a password field, or the mock can accept any password.
- `src/hooks/use-session.tsx` holds `SessionProvider` and `useSession()`, which returns `{ user, signIn, signInAsMockUser, signOut }`. Wrap the root layout in the provider.

## States

- Signing in: show a spinner and disable the buttons.
- Wrong password, or a username that's already taken: show the message under the button, the same way the current `message` text works.

## Open questions

- Should sign-in survive an app reload? For the demo, keeping it in memory is fine, and reloading signs you out. Supabase auth will handle this later.
- Should the demo buttons be hidden in a real release build?
