# Theme across root boundaries

Measured on iOS (lab): **the theme class never crosses a native view-tree
boundary; token VALUES always do.** Octane portals keep their source context
when children render in a caller-owned native host, but the host still needs
its own theme classes.

- `ns-dark` on the app root is absent inside pushed `Page` roots and roots
  created by imperative sheet/modal services.
- Declarative `UIModal`/`MaterialDialog` content, including `component` +
  `params`, uses a portal and preserves context; `applyThemeClasses` stamps
  the native modal host.
- The optional platform `@octane-xplat/sheet` and
  `@octane-xplat/context-menu` leaves portal their hosted content on Android.
  Their current iOS implementations still use independent Octane roots.
- `getCssVariable('--color-primary')` returns the identical value
  (`#4f46e5`) in every root — vars live at app stylesheet scope, not class
  scope.

```ts
// ThemeProbe.mobile.ts: call with the actual native view for this root.
import type { View } from '@nativescript/core'

export function primaryColor(view: View) {
	return view.getCssVariable('--color-primary')
}
```

## Consequence for ThemeProvider

A theme class on one root can never reach another. The design that works:

1. Theme **state** lives in a module-scope store (`useSyncExternalStore` —
   the same seam as `lastDemo` in the harness) so every root subscribes to
   the same value.
2. **Every independent root applies `ns-dark` to its own root view** — the
   app shell, each pushed `Page`, and content roots opened by imperative
   sheet/modal services. Component-owned portals keep the source context and
   stamp theme classes on their native host.
3. System scheme is per-process (`useColorScheme` reads it anywhere) — the
   store only needs to carry the manual override.

On web this is free (pushed routes render in the same DOM tree — the root
class inherits); the rule only bites on native, but write it uniformly:
each screen/root component takes `className` including the theme class
rather than relying on ancestor inheritance.

```tsx
import { useThemeScheme, themeSchemeClasses, View, Text } from '@octane-xplat/ui'

// Apply at the top of each screen, pushed page, and sheet content root.
export function RootContent() {
	const scheme = useThemeScheme()
	return (
		<View className={themeSchemeClasses()}>
			<Text>Trip notes</Text>
		</View>
	)
}
```

## What NOT to do

- Don't set the class on `getRootLayout()` expecting it to theme children
  roots — RootLayout hosts views; pushed pages/sheets are separate trees.
- Don't assume separate `Page` or imperative modal roots inherit the source
  theme class — verified absent.
