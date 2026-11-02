Add an items screen at the URL path `/items` whose sort order lives in the URL.

- The sort order comes from the search parameter `sort`, which accepts only
  `name` or `price`. When `sort` is missing, the order is `name`.
- The screen shows `Sorted by: name` or `Sorted by: price`.
- An unsupported address such as `/items?sort=color` must not crash the app
  and must never show `Sorted by: color`.
- The screen has two buttons, `Sort by name` and `Sort by price`. They change
  the `sort` value in the URL without adding browser history entries.
- On the home screen (the existing content of `src/App.tsrx`), add a link with
  the text `All items` that opens `/items`.
- Code elsewhere in the app that navigates to `/items` with an unsupported
  `sort` value must get a type error.
- Keep the existing counter working, and keep `App` exported from
  `src/App.tsrx`.
