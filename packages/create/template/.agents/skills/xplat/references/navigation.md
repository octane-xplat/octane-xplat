# Navigation

One route table serves both targets. Declare named screens and stacks;
navigate with `<Link>`/`<NavLink>` in JSX or `pushRoute`/`popRoute`/
`useRoute`/`useCanGoBack` imperatively. Web maps routes to URLs and
history; native maps them to Frame pages and the back stack — the same
call sites drive both.

## Rules

- **Params are scalar.** They serialize as query strings on web — pass
  strings and numbers. Objects survive on native and are silently dropped
  on web.
- **Tabs and named stacks** (`Tabs` + `TabSpec`, `registerStack`) exist on
  both targets. Use a named stack for overlay-style flows (sheets,
  sidebars) that shouldn't replace the root page.
- **Deep links:** web is the URL itself; native parses incoming URLs into
  the same route names — keep names stable and shareable.
- **Back** — browser back, hardware back (Android), and swipe-back (iOS)
  all map to `popRoute` on the current stack.

## Known gap

Pushing into a *named* stack is iOS-only until
[NativeScript#11444](https://github.com/NativeScript/NativeScript/issues/11444)
lands — `pushRoute` there warns loudly on Android instead of dropping
silently. Root-stack navigation works on both platforms.

For loaders, route config, and generated route types, see the navigation
guide: https://octane-xplat.goddardai.org/navigation
