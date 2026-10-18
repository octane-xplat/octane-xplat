# macOS plugin compatibility (decision #115)

Status: decided (2026-10-18) — build to it.

## Goal

End users can share/consume NativeScript plugins on macOS. Not by adopting
`@nativescript/macos` (one stale release — 9.0.0, Feb 2026 — and plugin
`platforms/macos` bits don't exist anyway), but by giving
`packages/macos-renderer` two things it lacks today:

1. an **extension seam** — new element types currently require edits inside
   `index.ts` (factory switch, `applyProps` switch, layout dispatch,
   `destroy`/`insert` lists, warn tables). Every seam is a hard-coded
   `type === 'x'` check.
2. an **NS-core compat slice** — the bounded JS surface plugin code actually
   touches: `Observable`, `Property`/`CssProperty` registration, a
   `ViewBase`-shaped owner for native views, and a `Style` object that routes
   assignments into the renderer's style pipeline.

## Part 1 — element behavior registry

`index.ts` gains a registry consulted at each existing dispatch point:

```ts
interface ElementBehavior {
	/** Factory — sets node.view (and actionId/childHost where relevant). */
	make?: (node: ElementNode, props: PropBag) => void
	/** Prop dispatch — return true when handled. Called before the warn path. */
	applyProp?: (node: ElementNode, name: string, value: any) => boolean
	/** Manual child layout, called from reconcileLayoutParent. */
	layout?: (parent: ElementNode) => void
	/** Natural size for intrinsicContentSize plumbing. */
	naturalSize?: (node: ElementNode) => { width: number; height: number } | null
	/** Teardown — called from destroy() before view teardown. */
	destroy?: (node: ElementNode) => void
	/** Can host view children (adds to VIEW_PARENT_TYPES semantics). */
	container?: boolean
	/** Style keys this element consumes (suppresses warn path). */
	styleKeys?: ReadonlySet<string>
}
```

`registerElement(type, behavior)` is exported from the package so a leaf
package can contribute elements without touching `index.ts`. `masonview` is
the proving consumer: `mason.ts` self-registers and `index.ts` keeps only
the generic dispatch. Style/className defaults stay renderer-owned —
behaviors override per-prop, not the whole pipeline.

Non-goals for the seam: replacing the built-in layout functions (stack,
wrap, grid, dock keep their specialized code), virtual/non-view elements
(`#text`, `span` — a separate existing seam), and hot-reload re-registration
(re-registration is idempotent replace-by-type).

## Part 2 — `@nativescript/core` compat slice

A leaf package (working name `@octane-xplat/macos-ns-compat`) that apps alias
`@nativescript/core` to under the macOS renderer:

```ts
class Observable {
	on(event: string, cb: (...args: any[]) => void): void
	off(event: string, cb?): void
	notify({ eventName, object, ...data }): void
}

class Property<Owner, T> {
	constructor({ name, defaultValue, affectsLayout? , valueConverter? })
	// registers get/set on the owner prototype chain
}

class CssProperty<Owner extends Style, T> extends Property {
	// + cssName, registered via static on the Style subclass
}

class ViewBase {
	nativeView: NSView | null      // the bridged AppKit view
	style: Style
	className: string
	on/off/notify (Observable)
	layoutRequested hook -> renderer's queueLayoutReconcile
}
```

A plugin's `index.macos.ts` (or `common.ts`) writes
`class MyView extends ViewBase`, registers `CssProperty`s, and exposes a
`createNativeView()`-shaped factory. The compat package adapts that to
`registerElement('myview', {...})` on the renderer: view creation calls the
plugin's factory, prop assignment goes through the plugin's `Property`
table, and the plugin's own layout behavior wins via the `layout` hook.

Deliberately out of scope for v1: `application`/`frame`/`page` navigation,
dialogs, `file-system`, `image-source`, gesture recognizer classes — add per
plugin demand, not preemptively.

## Consequences

- Mason stops being renderer internals — `mason.ts` registers itself, and a
  future extraction to `@octane-xplat/mason` is mechanical.
- The compat package is also where a mason *element set* could land later
  (MasonKit's `masontext`/`masonscroll` shapes on our host) if that ever
  becomes wanted; the engine binding stays the `mason-c` dylib.
- Native-code plugins still need macOS ports against our AppKit host — the
  compat slice makes that a bounded task (mason-c is the template), not an
  ecosystem blocker.
- Linux GTK inherits the same pattern when `packages/linux-gtk-renderer`
  lands — GJS gets its own `mason-c` binding and the seam shape ports.
