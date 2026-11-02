The app lists its guides as data in `src/guides.ts`. Do not change its
exports. Add a guide screen registered from that data.

- The guide screen lives at the URL path `/guides/:slug` and shows
  `Guide: <title>` for the guide with that slug, for example `Guide: Set up`
  at `/guides/setup`.
- Define this route in code with the router's programmatic route API, in a
  module outside `src/app`. Do not add a guide file under `src/app`.
- An unknown slug such as `/guides/missing` must not crash the app and must
  never show `Guide:`.
- On the home screen (the existing content of `src/App.tsrx`), add a link with
  the text `Read the setup guide` that opens the `setup` guide.
- Code elsewhere in the app that navigates to the guide screen without a slug
  must get a type error.
- Keep the existing counter working, and keep `App` exported from
  `src/App.tsrx`.
