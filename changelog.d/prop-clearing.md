# Removing a shared prop now restores its documented default

A prop that disappears between renders — or that a render passes as
`undefined` or `null` — now resets the underlying host property to the same
value it holds when the prop is never supplied. Previously the native drivers
merged each update into the last prop bag, so a dropped `hint`, `checked`, or
`rowGap` kept its stale value on iOS, Android, and macOS while web removed it
correctly.

The semantics are uniform across platforms:

- Omitting a prop and passing `prop={undefined}` are identical — both reset.
- `prop={null}` also resets; `null` is not a distinct value unless the prop's
  own contract declares one. To render an explicit neutral state, pass the
  concrete value (`''`, `0`, `false`).
- Inside a `style` object, a key that drops or turns `null` resets that key;
  removing the `style` prop clears all of it.
- Dropped `on*` handlers unbind, as they already did.

On the NativeScript lane this routes through the native property system's
`unsetValue` reset; on macOS the renderer injects explicit clears into the
merged bag. Code that relied on the stale-value behavior — or kept a key
present to "hold" a previous value — will now see the documented default
instead. See `docs/verify/known-limits.md`.
