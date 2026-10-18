# @octane-xplat/linux-gtk

Experimental GTK4 renderer for Octane on Linux, driven from GJS. This is the
native-widget counterpart of the `webkitgtk` runtime in `apps/linux`: the
Octane universal runtime runs **inside** GJS and mounts real GTK4 widgets —
the same architecture `packages/macos-renderer` uses for AppKit.

Status: **v1 scaffold, build-verified only.** The feasibility evidence for the
approach (universal runtime loading in GJS 1.82, scheduling bridge,
reconciliation, XTEST hit-testing) lives in
`.agents/design/linux-gtk-feasibility-review.md` and
`.agents/docs/notes/linux-gtk-capability-inventory.md`. Runtime verification
of this driver is pending a Linux host — see
`.agents/docs/notes/linux-gtk-renderer.md` for the current status and smoke
path.

## Layout

| Export                     | Contents                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| `.`                        | `gtkDriver`, `createGtkRoot`, `GTK_RENDERER_ID`, `octane/universal/native` re-export |
| `./host`                   | `runGtkApp` — GtkApplication + window + content box + mounted root    |
| `./compat/native-core`     | `@nativescript/core` shim for leaves evaluated in a GTK bundle      |
| `./compat/escape-props`    | escape-props shim                                                   |

Implemented intrinsics: `stacklayout`/`stack`, `flexboxlayout`,
`absolutelayout`, `gridlayout`, `label`, `button`, `scrollview`, `textfield`,
`switch`, `slider`, `progress`, `activityindicator`, plus viewless `#text`,
`span`, `formattedstring`, `contentview`, `proxyviewcontainer`, `rootlayout`.
Anything else throws a named driver error at mount.

## Platform seam

GTK variant files use the `.gtk` suffix (`foo.gtk.tsx`), resolved before the
unsuffixed native default. `.linux` files belong to the WebKitGTK renderer
and are unreachable inside a GTK bundle — see the capability inventory for
why the two suffixes must not collide.

`/** @jsxImportSource @octane-xplat/jsx */` on line 1 of `.gtk.tsx` /
`.gtk.tsrx` files that contain JSX — the shared native contract is the JSX
source for every native target; the `gtk` customConditions entry binds the
GTK host element type. There is no renderer-owned `jsx-runtime` export.

## Bundle + run

`@octane-xplat/cli` ships `xplatLinuxGtk` (`@octane-xplat/cli/linux-gtk/vite`)
which wires the Octane compiler's `gtk` renderer, `gi://` externals, the
`.gtk` extension chain, and the `octane` → `octane/universal/native` retarget.
The output is one ESM file run with `gjs -m`.
