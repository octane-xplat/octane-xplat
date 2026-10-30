# AppKit navigation and links

Use for AppKit tab input, URL activation, incoming-link roots, overflow menus, and landmarks. Apply [route authoring](authoring.md) and [navigation ownership](ownership.md); source adapters do not establish physical input or accessibility.

## AppKit tab-strip input

TabList now reveals selected/focused tabs through native scroll geometry and
uses registered Tab views for roving focus. Arrows/Home/End move focus; Enter/
Space keep the renderer's press activation. Horizontal direction follows RTL;
role=tablist leaves vertical arrows to the page. Navigation strips accept both
axes. TabMenu overflow registration/menu ownership is covered below. The
keyboard/suppression/window-update bridges are source capabilities, not OS
qualification; native focus/Tab, scroll visibility, VoiceOver and panel relations
remain open. See [AppKit tab strips](../../../../../docs/app/components.md#tab-strips-on-appkit).

```tsx
import { useState } from 'octane'
import { TabList, Tab } from '@octane-xplat/ui'

export function Sections() {
	const [value, setValue] = useState('overview')
	return <TabList role="tablist" value={value} onChange={setValue}>
		<Tab value="overview" label="Overview" />
		<Tab value="details" label="Details" />
	</TabList>
}
```

## AppKit URL links

AppKit followHref normalizes/sanitizes destinations first. Explicit schemes
use the existing platform openUrl API; relative paths retain canonical router
navigation. Do not use the native openWindow hook for external URLs: that hook
creates an app window and does not load a URL. This helper also serves native
list/sidebar/token/breadcrumb paths, so its change is broader than plain Link.

```tsx
import { Link } from '@octane-xplat/ui'

export function Help() { return <Link href="https://example.com/help">Help</Link> }
```

Link wraps primitive children, forwards presentation classes/color, and supports
function components from as/LinkProvider (as wins). Valid injection owns
navigation; unsafe destinations do not reach an injected component. Native
target browsing contexts/custom intrinsic strings/tooltip presentation remain
unsupported or unqualified; native launch/keys/VoiceOver/wrapping/layout still
need evidence. See the [AppKit guide](../../../../../docs/app/navigation.md#open-links-on-appkit).

```tsx
import { Link } from '@octane-xplat/ui'

function AppLink(props: { href: string; onPress?: () => void }) {
	return <Link href={props.href} as="a" onPress={props.onPress}>Help</Link>
}
export function CustomHelp() { return <Link as={AppLink} href="https://example.com/help">Help</Link> }
```

## AppKit incoming-link root ownership

Native launch links can arrive before a window or outlet exists. The maintained
AppKit harness now binds from its primary App.tsx root effect after outlet layout
setup; route imports only configure the catalog. Keep the binding outside retained
route layouts so pushed screens do not add competing subscriptions. Its private
appkit-route-links helper acquires cleanup before a deferred initial flush,
retains the router's existing admission/cancellation semantics, observes rejection/
refusal without logging URL/error payloads and retires pending callbacks on root
replacement/unmount/HMR. This is not a new public router readiness API.

```tsx
import { useEffect } from 'octane'
import { App } from '@xplat/app'
import { bindAppKitRouteLinks } from '@xplat/app/appkit-route-links.macos'

// Private proving host only; app authors use the canonical public example.
export default function AppKitApp(props: Parameters<typeof App>[0]) {
	useEffect(() => {
		try { return bindAppKitRouteLinks() }
		catch { console.warn('[macos] Incoming link setup failed') }
	}, [])
	return <App {...props} />
}
```

Already handed-off navigation remains owned by the router; disposing a producer
binding does not cancel accepted work globally. Missing/blocked target panes use
the normal router result/recovery policy. No polling, automatic guard bypass,
forced serialization, persistent launch queue or per-secondary-window support is
added. The nine source models use fake hooks/router and require separate verification, as do native
cold/warm launch, real effect ordering, scheme/signing, focus/AX and installed apps.
See [incoming links](../../../../../docs/app/navigation.md#handle-incoming-links).

## AppKit overflow-tab keyboard ownership

TabMenu registers its current trigger with TabList, using the selected overflow
value for strip focus/reveal. Down/Up on the concrete trigger requests first/last
option opening; pointer/Enter/Space activation stays on Pressable. The popup now
reuses MenuSurface/useAppKitMenuRow and the menu return owner for row focus,
manual selection/typeahead, Tab-neighbor intent and ordinary layer Escape.
Current options, attachment and selection reentry guards reject stale callbacks;
empty lists disable/close. No public prop, dependency or separate layer is added.

```tsx
import { TabList, Tab, TabMenu } from '@octane-xplat/ui'

export function Sections(props: { value: string; change(value: string): void }) {
	return <TabList role="tablist" value={props.value} onChange={props.change}>
		<Tab value="overview" label="Overview" />
		<TabMenu label="More" options={[{ value: 'settings', label: 'Settings' }]} />
	</TabList>
}
```

 Native key/
ref/focus/Tab/return/scroll/popup/AX/package qualification remains open, including
radio mark announcements. The reused MenuSurface now has scoped focused-row
repair source ownership; see the [dynamic menu guide](../../../../../docs/app/menus.md#keep-focus-owned-when-appkit-menu-rows-change). That implementation is not native
input or dynamic-menu qualification.
See [AppKit overflow tabs](../../../../../docs/app/components.md#overflow-tabs-on-appkit).

## AppKit landmark cycling

useLandmark now selects a dedicated AppKit source leaf. Spread landmarkProps
on native containers; source F6/Shift+F6 routes within the event window and
current containing FocusScope, following native view order and innermost
current regions. Field editors resolve to their input; empty regions retain
programmatic focus without Tab stops. Hidden/disabled/detached regions are
skipped, and native reveal is requested after accepted focus. Ctrl/Option/
Command F6, composing text and handler-cancelled keys are not taken over.
Missing bridge support leaves role/label forwarding. Registration leases and
one monitor retire on unmount/HMR disposal. Web uses mount order; native
ordering, empty-region and nested behavior must not be inferred from it.
Native F6/focus/containment/scroll/VoiceOver and HMR/packed lifetime require separate verification;
role/label forwarding is not proof of native AX landmark semantics.

```tsx
import { TextInput, VStack, useLandmark } from '@octane-xplat/ui'
export function SearchRegion() {
  const { landmarkProps } = useLandmark({ role: 'search', label: 'Document search' })
  return <VStack {...landmarkProps}><TextInput label="Search" /></VStack>
}
```
