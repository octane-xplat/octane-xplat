# Theme across native hosts

Octane content ownership and native view-tree inheritance are separate.
Portals retain source providers, but a theme class on the source view does not
cross into another native host. Framework-owned hosts apply their own theme
classes. For remaining independent roots and platform exceptions, consult the
[current ownership inventory](../../../../docs/notes/portal-boundaries.md).

## Apply the shared theme

Match theme classes on the styled root itself as well as on an ancestor when
supporting both renderer roots and nested hosts. A descendant selector alone
does not match a root that carries both classes.

```css
.trip-host.ns-dark,
.ns-dark .trip-host {
	background-color: var(--color-surface, #171717);
}
```

Use the shared preference APIs instead of introducing another manual-override
store. Subscribe in each independently rendered root, and apply theme classes
to its root view. A native host created by app code needs the same treatment.

```tsx
import {
	useThemeScheme,
	themeSchemeClasses,
	setThemePreference,
	View,
	Button,
} from '@octane-xplat/ui'

export function RootContent() {
	useThemeScheme() // Subscribe so classes refresh with the preference/system scheme.
	return (
		<View className={themeSchemeClasses()}>
			<Button clickAction={() => setThemePreference('dark')}>Use dark theme</Button>
		</View>
	)
}
```

For an imperative native host, bind theme classes for its lifetime and call
the returned cleanup when disposing it.

```ts
// ThemeHost.mobile.ts — the app owns this host's lifecycle.
import { applyThemeClasses } from '@octane-xplat/ui'
import type { View } from '@nativescript/core'

export function bindHostTheme(host: View) {
	return applyThemeClasses(host, 'trip-host')
}
```

Do not assume a pushed Page, modal, or sheet inherits its presenting host's
classes, and do not treat an app-wide token lookup as proof that a local dark
class was inherited. The optional iOS/Android sheet and context-menu content
also uses source-owned portals; consult the boundary inventory before making
claims about another host or renderer.

## Named themes on AppKit

Use the shared `Theme` and `defineTheme` exports on macOS. The AppKit leaf
registers scoped token rules with the renderer's CSS engine; it must not import
NativeScript's `Application.addCss` injector. Detached hosts still need the
class binding described above. Export and bundle checks do not establish
runtime color parity for nested scopes.

```tsx
import { defineTheme, Theme, Text } from '@octane-xplat/ui'

const travel = defineTheme({ name: 'travel', tokens: { '--color-primary': '#2463eb' } })
export function TravelSection() {
	return <Theme theme={travel}><Text>Upcoming trips</Text></Theme>
}
```
