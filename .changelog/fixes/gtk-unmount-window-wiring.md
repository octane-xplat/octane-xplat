### GTK roots detach from their window when unmounted

On Linux GTK, `root.unmount()` now disconnects the window and surface signal handlers and removes the keyboard and pointer controllers that the root added to its window. Previously they stayed attached, so mounting again into the same window, for example after a hot reload, added another set each time, and the old handlers kept running against the unmounted root.

```ts
const { root } = createGtkRoot(host)
root.render(App, {})
root.unmount() // also detaches the root's window handlers and controllers
```
