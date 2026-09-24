# Moving between screens

> Give every destination a name and let the same screen map to a browser URL
> or a native navigation stack.

## A route is a destination

Routes have three pieces:

```ts
pushRoute({
  stack: 'root',
  name: 'settings',
  params: {},
});
```

The `name` identifies the screen. `params` carries the small amount of data
needed to open it. `stack` is `root` for the main flow or a named stack such
as a tab's inner navigation.

On the web, the route becomes a real URL, so refresh, back, bookmarks, and
shared links keep working. On native, the same route pushes a screen into the
matching navigation stack.

## Keep browser links real

Use an anchor when the user is following a document or destination that should
be copyable and openable in a new tab. Use `pushRoute` for an in-app action
that is not naturally an anchor.

```tsx
<a href="/settings">Settings</a>
```

For a component that must observe the current destination, use `useRoute` on
the stack it owns. A tab can therefore keep its own history without taking
over the whole app.

## Choose a stack

Use the root stack for the main app flow. Use a named stack for independent
flows such as tabs, where each tab should remember its own screen. Keep modal
content separate from ordinary back-stack navigation.

The [navigation notes](navigation-notes.md) explain native containers, modal
roots, deep links, and the platform-specific tradeoffs.
