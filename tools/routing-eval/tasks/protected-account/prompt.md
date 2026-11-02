The app has a small session module at `src/session.ts`. Do not change its
exports. Add a protected account screen.

- The account screen lives at the URL path `/account` and shows
  `Hello, <name>` for the signed-in user, for example `Hello, Ada`.
- When nobody is signed in, opening `/account` must show a sign-in screen at
  `/login` instead. The account screen must not render, even briefly.
- The sign-in screen shows the text `Please sign in`. It receives the
  requested path in the search parameter `returnTo`, for example
  `/login?returnTo=%2Faccount`.
- The sign-in screen has a button `Sign in as Ada`. It calls `signIn('Ada')`
  and then opens the `returnTo` path, replacing the sign-in history entry. The
  user then sees `Hello, Ada`.
- Decide access with the router's guard and context features, not with a
  check inside the account screen component.
- Code elsewhere in the app that navigates to `/login` with a non-string
  `returnTo` must get a type error.
- Keep the existing counter working, and keep `App` exported from
  `src/App.tsrx`.
