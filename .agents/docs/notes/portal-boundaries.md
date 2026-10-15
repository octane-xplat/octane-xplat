# Remaining portal boundaries

> Contributor proposal: preserve the providers around the declaring component
> while native navigation and widgets keep owning their views. The ownership
> APIs below are proposed, not published APIs.

The iOS Pager blocker is resolved. The remaining content boundaries have a
feasible migration path: route outlets for navigation, component-owned outlets
for imperative services, and compiler-backed wrappers for raw AppKit tabs and
list cells. NativeScript platform lists can own their cell portals directly,
using the existing Pager pattern. Keep application and independently
bootstrapped window roots.

| Boundary                                                 | Recommended solution                                                                                       | What remains before cutover                                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| iOS Pager                                                | Reuse the isolated host's Core entrypoint for upstream style-property imports                              | Context probe passes; OS swipes remain outside that probe                                          |
| Pushed native Pages                                      | A mounted outlet owns a portal for every live backstack entry                                              | Push/pop, native interactive back, canceled navigation, loaders, and owner teardown                |
| Route modals                                             | The same route outlet owns content for the modal's native host                                             | Dismissal races, native dismissal, nested modals, and owner teardown                               |
| Imperative modal and bottom-sheet services               | A hook returns an opener and an element placed under the desired providers                                 | Preserve result promises, close handles, presentation options, and owner cleanup on each platform  |
| AppKit tab items                                         | A compiler-backed component keeps the raw logical handle and portals its content into the native item view | Preserve lazy mounting and handle transfer/reorder/removal; stop creating the legacy content root  |
| AppKit list cells                                        | A compiler-backed component owns portals into the recycled cell hosts                                      | Binding/release notifications, reuse generations, item identity, and list teardown                 |
| iOS UITableView and Android RecyclerView                 | The existing platform components own template hosts and portal slots, following Pager                      | Cell reuse, data replacement, refresh, sizing, scrolling/viewability, and disposal on both targets |
| Application, workshop, and independent window bootstraps | Keep a top-level root per independently owned application/window tree                                      | No conversion needed                                                                               |

## Preserve the outlet's context

An outlet is a component that renders content into a native host elsewhere.
Its position in the Octane tree determines which enclosing providers the
content receives. A single app-level outlet cannot inherit a provider nested
inside an individual screen. Place the outlet below the providers that must
be shared; use another owner scope when a screen-local provider must travel
with its presented content.

```text
Application root
└─ Account provider
   └─ Stack outlet                     ← routed screens inherit Account
      └─ Screen-local draft provider
         └─ Presentation outlet        ← its modals inherit Account + Draft
```

The existing portal operation is sufficient once that owner has a target.
This function illustrates the rendering step; it does not create an outlet
or register its lifecycle.

```ts
import { createPortal, type UniversalRenderable } from 'octane/universal/native'

function renderOwnedContent(content: UniversalRenderable, target: unknown) {
	return createPortal(content, target)
}
```

Source review of the installed Octane 0.11.0 universal runtime found no public
root option for inheriting another root's context or capturing arbitrary
caller context. Its host-attachment capability tracks physical attachment and
refs; it does not supply a context bridge. The recommendation therefore uses
ordinary component ownership. Octane's [render-scope explanation](https://github.com/octanejs/octane/blob/main/docs/differences-from-react.md#jsx-values-follow-the-represented-render-scope)
also makes clear that moving a JSX value does not capture the context around
its construction.

## Native routes: retain the source tree with the backstack

Replace the new roots in [commitRoute and pushModal](../../packages/ui/src/route.ts)
with records delivered to a mounted stack outlet. NativeScript continues to
create Pages, GridLayouts, transitions, and modal hosts. The outlet renders
the existing RouteHost into each target, preserving layouts, error boundaries,
loader results, and route parameters. Keep a stable identity per navigation
entry, including repeated visits to the same route.

```ts
import type { GridLayout, Page } from '@nativescript/core'
import type { UniversalRenderable } from 'octane/universal/native'

// Proposed internal record, rendered by the owning outlet.
interface RoutePortalEntry {
	entryId: string
	ownerId: symbol
	page: Page | null
	host: GridLayout
	content: UniversalRenderable
	phase: 'staged' | 'committed' | 'closing'
}
```

Retain each entry while its Page remains in the native stack. An unload or tab
switch must not dispose it. Remove it after a confirmed pop, completed modal
close, failed navigation, or destruction of its owner. Commit the portal before
presenting a host whose size depends on content. Reconcile native navigation
events as well as calls made through the router; canceled interactive back
must leave the entry mounted.

Associate the outlet with a particular stack and window. Existing global
navigation can address that registered stack scope; it cannot infer an
arbitrary screen-local provider. Calls that require a local scope need an
explicit owner-bound navigator. Preserve the existing standalone-root path
until an outlet is registered and its behavior is qualified. This is a source
design proposal; no router cutover is included in this change.

## Imperative services: reuse the existing element pattern

[useImperativeDialog](../../packages/ui/src/use-imperative-dialog.tsrx) already
separates the opener from an element that stays in the declaring tree.

```tsx
import { Button, Text, useImperativeDialog } from '@octane-xplat/ui'

export function SaveNotice() {
	const dialog = useImperativeDialog()
	return (
		<>
			<Button clickAction={() => dialog.show(<Text>Draft saved</Text>)}>Show notice</Button>
			{dialog.element}
		</>
	)
}
```

Apply that pattern to platform modals and imperative sheets. These proposed
hooks retain the existing service function types and add the element that owns
their content; names remain subject to the framework's API review.

```ts
import type { UniversalRenderable } from 'octane/universal/native'
import type { OpenModal, OpenBottomSheet } from '../../packages/ui/src/props'

interface OwnedModal {
	open: OpenModal
	element: UniversalRenderable
}

interface OwnedBottomSheet {
	open: OpenBottomSheet
	element: UniversalRenderable
}
```

Reuse each platform's presentation, keyboard, detent, theme, and dismissal
machinery. Replace only its content-root ownership. Resolve each pending
result exactly once, invalidate late open completions, and close all owned
surfaces when the element unmounts. Support multiple live handles rather than
silently reducing the services to one open surface. Services called without
an explicit owner retain their existing context-independent contract.

## AppKit tabs and cells: adapt behind the raw vocabulary

Keep the authored tab/list vocabulary and logical/native refs. Change the
compiler adapters to introduce component ownership around their content,
with the raw native node inside the wrapper. The current tab adapter hides
children in an opaque prop and the driver creates a new content root; the
list driver calls renderItem inside a cell root. Neither operation retains
the surrounding provider scope. The wrapper must evaluate app content in its
own source tree and use the native node solely as a portal target.

For tabs, expose an internal target notification only while the native item
has an owner. Preserve the current contract: an unassigned logical handle has
no mounted content, reordering or transferring an assigned handle preserves
content identity, and removing it unmounts content. Simply enabling ordinary
children would change that lazy-mount contract and also require new layout
handling for the item's plain NSView host. Coalesce target notifications at
the end of a renderer batch so a transfer does not briefly unmount the source.

For lists, send explicit binding and release notifications. Key portal slots
by native host identity, and attach a generation to each binding so a late
release cannot remove a newly rebound cell. Define item-state reset separately
from host identity: a recycled host representing another item must not inherit
that item's local state. Keep native factory templates on their existing
native-view path; they are not renderItem component content.

```ts
// Proposed internal list notifications; these are not public app events.
type CellTargetEvent =
	| {
			type: 'bind'
			slotId: string
			generation: number
			target: unknown
			index: number
			itemKey: string | number
	  }
	| { type: 'release'; slotId: string; generation: number }
```

The source changes belong in [tab-view.ts](../../packages/macos-renderer/src/tab-view.ts),
[list-view.ts](../../packages/macos-renderer/src/list-view.ts), and the
[compiler adapter](../../packages/cli/src/macos/tab-item.mjs). A wrapper prototype
passed eight assertions in a real AppKit/JavaScriptCore process: nearest-provider
inheritance and live updates for both boundaries, the tab's physical target,
and effect/native-child cleanup. That prototype still permits empty legacy
roots and does not qualify tab-handle transfer or cell recycling. Add those
lifecycle notifications and extend the maintained lifecycle fixtures before
replacing the production root path.

The earlier inventory also omitted NativeScript's
[UITableView](../../packages/ui/src/ios/UITableView.ios.tsrx) and
[RecyclerView](../../packages/ui/src/android/RecyclerView.android.tsrx).
Both forward renderItem to the upstream adapter, which still creates one root
per cell. Their existing component wrappers can own template-created GridLayout
hosts and portal slots directly, following Pager. Stop passing renderItem to
the raw driver, bind the hosts through itemLoading, and evaluate row content
in the platform component's source tree. Keep the existing scroll, refresh,
and viewability integration. An explicit host-disposal path and final list
teardown must release slots; do not assume Pager's disposal events are also
available on Core ListView. This extension is source-backed and has not had a
mobile runtime probe.

## Qualification and order

The maintained iOS Pager case passed 3/3 assertions on an iPad Pro simulator:
initial context, live update, and current context after a programmatic page
change. The test-host fix maps style-property imports to Core's existing root
export, preserving the same property objects. A maintained bundle regression
also checks that the emitted imports resolve to the supplied Core singleton.
Replace `DEVICE_ID` with the UDID of an already booted simulator reserved for
this run through the host resource broker.

```sh
pnpm probe run examples/probes/native-pager-portals.ios.tsrx --target ios --watch --ios-device DEVICE_ID --deps @octane-xplat/pager
node --test scripts/probe.test.mjs
```

Proceed with owned services, then AppKit wrappers, then router outlets. The
first follows an existing UI pattern; AppKit now has bounded runtime evidence;
the router carries the most lifecycle risk because hidden backstack entries
must retain state. For every cutover, qualify nearest-provider inheritance,
live updates, preserved state where required, and teardown on the real target.
These checks establish ownership and lifecycle behavior; they do not establish
visual parity, OS gestures, focus, or hit-testing.
