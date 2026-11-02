The app has a small stock service at `src/stock.ts`. Do not change its
exports. Add a stock screen that loads its data before it opens.

- The stock screen lives at the URL path `/stock/:id`. It loads the count with
  `loadStock(id)` before the screen appears, and shows `In stock: <count>`,
  for example `In stock: 4` for the id `coat`.
- On the home screen (the existing content of `src/App.tsrx`), add a link with
  the text `Check coat stock` that opens the stock screen for the id `coat`.
- `loadStock` can fail. When opening the stock screen fails, the home screen
  stays visible and shows `Could not load stock` with a button `Try again`.
  Pressing `Try again` loads again and, when loading succeeds, opens the stock
  screen.
- Code elsewhere in the app that navigates to the stock screen without an id
  must get a type error.
- Keep the existing counter working, and keep `App` exported from
  `src/App.tsrx`.
