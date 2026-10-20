Add an item detail screen at the URL path `/items/:id`.

- The detail screen shows the text `Item: <id>`, for example `Item: coat`.
- It has a `Back` button that returns to the previous screen.
- On the home screen (the existing content of `src/App.tsrx`), add a link with
  the text `Open coat` that opens the detail screen for item `coat`.
- Opening `/items/hat` directly in the browser shows `Item: hat`.
- Keep the existing counter working, and keep `App` exported from
  `src/App.tsrx`.
