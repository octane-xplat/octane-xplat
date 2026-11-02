Organise the home screen into two tabs whose navigation stays inside each tab.

- On the home screen (the existing content of `src/App.tsrx`), add tabs titled
  `Catalog` and `Account`, with `Catalog` selected first. Use two navigation
  stacks named `catalog` and `account`, one per tab.
- The `Catalog` tab first shows `Choose an item` and a link `Open coat`. The
  link opens an item screen at the URL path `/items/:id` for the id `coat`,
  which shows `Item: coat` and a `Back` button.
- The item screen opens inside the `Catalog` tab: the tab titles stay visible.
- The `Account` tab shows `Account settings`.
- After opening the coat in `Catalog`, switching to `Account` and back to
  `Catalog` still shows `Item: coat`. Pressing `Back` then returns the
  `Catalog` tab to `Choose an item`.
- Code elsewhere in the app that navigates within a stack name other than
  `catalog` or `account` must get a type error.
- Keep the existing counter working, and keep `App` exported from
  `src/App.tsrx`.
