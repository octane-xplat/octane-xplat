# Own shared temporary surfaces

ID: shared-overlays
Targets: web, ios, android, macos
Related APIs: Dialog, AlertDialog, BottomSheet, BottomSheetSwitcher, HoverCard, Lightbox, Carousel, ScrollableArea, useScrollableArea, Toast, ToastViewport, useToast, showToast, useImperativeDialog, useImperativeAlertDialog, useLightbox, openBottomSheet, closeBottomSheet, useImperativeBottomSheet, useImperativeModal, RouteOutlet, useNativeRouteNavigator, UIModal, MaterialDialog, openModal, Overlay, Popover, useLayer

## Starting point

A working app with a Screen and state for showing temporary content. Shared
in-window surfaces are distinct from the optional platform-native sheet leaf.
Use `Dialog` for modal content, `AlertDialog` for required decisions, and
`BottomSheet` for bottom-anchored content.

```tsx
import { useState } from 'octane'
import { Dialog, AlertDialog, BottomSheet, Button, Text } from '@octane-xplat/ui'

export function Surfaces() {
	const [surface, setSurface] = useState<'dialog' | 'alert' | 'sheet' | null>(null)
	const onOpenChange = (open: boolean) => {
		if (!open) setSurface(null)
	}
	return (
		<>
			<Button clickAction={() => setSurface('dialog')}>Trip details</Button>
			<Button clickAction={() => setSurface('alert')}>Remove trip</Button>
			<Button clickAction={() => setSurface('sheet')}>Bag details</Button>
			<Dialog isOpen={surface === 'dialog'} onOpenChange={onOpenChange}>
				<Text>Trip details</Text>
			</Dialog>
			<AlertDialog
				isOpen={surface === 'alert'}
				title="Remove trip?"
				actionLabel="Remove"
				onOpenChange={onOpenChange}
				onAction={() => {
					console.log('Confirmed')
					setSurface(null)
				}}
			/>
			<BottomSheet label="Bag details" isOpen={surface === 'sheet'} onOpenChange={onOpenChange}>
				<Text>Carry-on</Text>
			</BottomSheet>
		</>
	)
}
```

`ToastViewport` owns toast routing; `showToast(options)` and `useToast()` send
notifications to a mounted viewport or the fallback viewport and return a
`ToastHandle` (`dismiss()`, `update(options)`) — `null` when a
`collisionBehavior: 'ignore'` duplicate suppressed the toast.

```tsx
import { Button, ToastViewport, useToast, showToast } from '@octane-xplat/ui'

function SaveButton() {
	const toast = useToast()
	return <Button clickAction={() => toast({ body: 'Trip saved' })}>Save</Button>
}

export function SaveNotice() {
	return (
		<>
			<ToastViewport>
				<SaveButton />
			</ToastViewport>
			<Button clickAction={() => showToast({ body: 'Background save complete' })}>
				Show background notice
			</Button>
		</>
	)
}
```

`ScrollableArea` provides scrolling for bounded content and replaces the older
`ScrollView` and `ScrollBox` names.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Details() {
	return (
		<ScrollableArea label="Trip details">
			<Text>Two bags packed</Text>
		</ScrollableArea>
	)
}
```

`HoverCard` reveals supplementary content around a trigger. `Carousel` arranges
scrollable slides, and `Lightbox` opens an image collection for closer viewing.
Keep the image descriptions meaningful for people using assistive technology.
Replace the sample image URL with an image in your app.

```tsx
import { useState } from 'octane'
import { HoverCard, Carousel, Lightbox, Button, Text } from '@octane-xplat/ui'

const media = [{ src: 'https://example.com/trip.jpg', alt: 'A mountain lake on our trip' }]

export function TripPreview() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<HoverCard content={<Text>Saved yesterday</Text>}>
				<Text>Autumn trip</Text>
			</HoverCard>
			<Carousel label="Trip previews" hasButtons>
				<Button clickAction={() => setOpen(true)}>View trip photo</Button>
			</Carousel>
			<Lightbox isOpen={open} onOpenChange={setOpen} media={media} />
		</>
	)
}
```

## Requirements

- Choose Dialog, AlertDialog, BottomSheet, Overlay, or Popover for modal,
  bottom, floating, or anchored content; use `useLayer` when the anchored
  layer's mount, anchor, or dismiss behavior needs direct control.
- Control visibility and distinguish user dismissal from programmatic removal.
- Own temporary content and its bindings through the declaring component.
- Preserve providers through scoped service outlets and native route outlets; pass explicit data to ownerless services and retain the app's theme.
- Use HoverCard for revealed content, Lightbox or Carousel for media, and
  ToastViewport for transient notifications; use ScrollableArea for scrolling.
- On macOS, use the owning window’s AppKit presentation layers, keep modal
  focus inside the surface, and distinguish native-state checks from OS input
  and accessibility verification.

## Acceptance criteria

- AC1: The reader can render a shared surface inside a Screen and choose its presentation without importing a platform widget.
- AC2: Outside user dismissal updates app state through onOpenChange; setting isOpen to false or removing the declaring component does not report a user dismissal.
- AC3: Removing an open declaration releases its content and bindings; a pending open completion cannot revive it, and content updates do not accumulate host theme subscriptions.
- AC4: The reader can tell which native content boundaries retain declaring-tree context and which still require explicit props/params or shared state.
- AC5: The reader can choose the public shared component names and anatomy for modal surfaces, hover cards, media, scrolling, and toasts, including the platform-native sheet boundary and macOS implementation limits.
- AC6: A shaded Web `Overlay` requires an accessible name; modal Web `Overlay` and `BottomSheet` contain keyboard focus, hide background actions, and restore focus to the opener after pointer, keyboard, and nested dismissal. Child popovers remain interactive inside their anchor's modal owner. Nested dialogs, menus, and hover cards share one Escape owner; controlled close requests do not cascade, composition is preserved, and removal cleans up ownership and focus return. Target limitations are explicit.

- AC7: Anchored layers honor placement, cross-axis alignment and clearance; logical sides mirror RTL. Custom and fixed coordinate systems, CSS-length support, anchor ownership and platform boundaries are documented.

- AC8: On macOS, declarative and imperative dialogs, alert dialogs, sheets, lightboxes, and toast stacks present above their owning screen; imperative sheet results, focus restoration, timed/manual toast dismissal, and owner-window cleanup follow the shared contracts.

- AC9: On macOS, bounded scrolling supports block, inline, and both axes; viewport refs replace and clear, headless overflow/edge state follows layout changes, and app-owned refresh exposes a named action with pending and result feedback. Pull-to-refresh and physical keyboard/trackpad qualification remain explicit boundaries.

- AC10: Shared phone sheets and bottom dialogs keep usable editing controls
  clear of an already-open keyboard. Detent and entrance transforms have separate
  ownership; panel swaps preserve the presentation and retire old editing state.
  Dismissal during keyboard movement releases bindings and restores eligible
  editing focus, with actual OS input qualified separately.

- AC11: AppKit Carousel delivers its existing handle and optional Previous/Next controls using current native viewport/slide geometry, clamped indexed navigation, looping only with multiple overflowing slides, logical RTL alignment and reduced-motion requests. Proportional layout measures each viewport-width slide and its track extent. Preserve vertical position, child/ref ownership, current resize/scroll state and teardown guards; distinguish source/policy/wiring evidence from native layout/input/AX/package qualification and remaining fade gaps; snap ownership is covered separately in AC12.

- AC12: AppKit Carousel hasSnap uses current native user-live scroll ownership, waits through active tracking and a quiet period, supports unbracketed user updates, and never arms from generic/programmatic bounds changes. Nearest measured edges preserve current RTL/reduced-motion/vertical behavior. Cancel stale metadata/scope/programmatic intent, retire late initialization after user/handle requests, and release timers/partial observer installation. Keep authored policy/wiring and SDK evidence separate from native input/momentum/layout/AX qualification and remaining fades.

- AC13: AppKit Lightbox image double-click uses current native clip-center magnification with media/policy reset. Current unzoomed pointer and recognized native swipe requests clamp to gallery bounds; preserve zoomed panning and ignore vertical/cancelled/incomplete/outside/foreign-window events. Own optional local monitors through panel replacement/disposal and current callbacks. Distinguish source/mocked handler evidence from actual native gesture/hit/zoom/cleanup/AX/package qualification; video playback stays explicit unsupported.

## Documentation

- AC1: The [AppKit normal-barrel fixture](../../../packages/ui/tests/macos-barrel.mjs) and [packed consumer](../../../packages/ui/tests/packed-consumer.mjs) check public import and declaration boundaries; they do not establish OS rendering or input. [Surface selection](../../../docs/app/primitives.md#when-a-screen-needs-more), [anchored useLayer layers](../../../docs/app/primitives.md#anchor-a-layer-to-an-element), [conditional BottomSheet example](../../../docs/app/primitives.md#own-temporary-surfaces), and maintained [Overlay demo](../../../packages/demos/src/OverlayDemo.tsrx).
- AC2: [Visibility and dismissal](../../../docs/app/primitives.md#own-temporary-surfaces) and maintained [Overlay demo](../../../packages/demos/src/OverlayDemo.tsrx).
- AC3: [Ownership and cleanup](../../../docs/app/primitives.md#own-temporary-surfaces); renderer lifecycle examples in `packages/ui/src/components/overlays/overlay-lifecycle.mobile.test.ts` cover pending opens, closes, failures, and theme subscriptions. The [AppKit layer content test](../../../packages/ui/src/components/overlays/use-layer-host.mobile.test.tsrx) checks updated content and cleanup through the host bridge with an object driver; it does not establish OS input or rendering.
- AC4: [Portal-backed surfaces and independent roots](../../../docs/app/primitives.md#own-temporary-surfaces), [native route roots](../../../docs/app/navigation.md#present-a-route-modally), and the maintained [modal portal component tests](../../../packages/ui/src/components/overlays/modal-portal.mobile.test.tsrx). iOS and Android runtime probes verify child-content context inheritance, updates, and close cleanup; Android and iOS tab/Pager probes verify provider context for those component boundaries, including a programmatic iOS Pager page change. OS swipes are not covered. The component test covers `component` + `params` portal ownership and props without device runtime evidence. The [macOS renderer portal fixture](../../../packages/macos-renderer/test/fixtures/portal-lifecycle.macos.tsrx) verifies provider context, updates, and cleanup for an `NSView` target; the AppKitSheet integration probe covers the actual sheet boundary. Scoped sheets, native imperative modals and platform list cells now preserve context; native pushed Pages and route modals do so through canonical `RouteOutlet` ownership and `useRouter()`. Maintained runtime fixtures cover [iOS services/list cells](../../../packages/ui/tests/fixtures/owned-boundaries.ios.tsrx), [Android services/list cells](../../../packages/ui/tests/fixtures/owned-boundaries.android.tsrx), [iOS routes](../../../packages/ui/tests/fixtures/owned-routes.ios.tsrx), [Android routes](../../../packages/ui/tests/fixtures/owned-routes.android.tsrx), [AppKit raw tabs/list cells](../../../packages/macos-renderer/test/fixtures/owned-boundaries.macos.tsrx), [AppKit surfaces](../../../packages/ui/tests/fixtures/owned-surfaces.macos.tsrx), and [web services](../../../packages/ui/tests/fixtures/owned-boundaries.web.tsrx). See [ownership contracts and runtime limits](../notes/portal-boundaries.md).
- AC5: [Shared component catalog](../../../docs/app/components.md#overlays), [useLayer anchored layers](../../../docs/app/primitives.md#anchor-a-layer-to-an-element), and maintained examples in [OverlayDemo](../../../packages/demos/src/OverlayDemo.tsrx), [ModalDemo](../../../packages/demos/src/ModalDemo.tsrx), and [ScrollBoxDemo](../../../packages/demos/src/ScrollBoxDemo.tsrx).
- AC6: [Temporary surfaces](../../../docs/app/primitives.md#own-temporary-surfaces), [input readiness evidence](../notes/input-readiness-notes.md), and the maintained [cross-browser input fixture](../../../apps/web/scripts/input-readiness.ts).

  [Nested dismissal](../../../docs/app/primitives.md#close-nested-layers-one-at-a-time), the nested dialog/menu/card in [OverlayDemo](../../../packages/demos/src/OverlayDemo.tsrx), and maintained [web regressions](../../../packages/ui/src/components/overlays/layer-dismissal.web.test.tsrx) and [cross-root object-driver tests](../../../packages/ui/src/components/overlays/layer-dismissal.mobile.test.tsrx). Object-driver evidence does not establish OS keyboard input or native focus traversal.

- AC8: [macOS shared presentations](../../../docs/app/primitives.md#macos-shared-presentations), [maintained example](../../../examples/probes/shared-presentations.tsrx), [isolated AppKit verification](../../../apps/macos/test/verify-overlays.mjs), and [bridge lifecycle tests](../../../packages/macos-renderer/test/presentation.test.ts).

Windows remains experimental: native mounting and cleanup have bounded runtime
evidence, while gesture, dismissal, focus, and accessibility gaps remain. See
the [Windows support boundary](../../design/windows-notes.md#current-support-boundary);
Windows is not added to this recipe’s supported targets.

- AC7: [Anchored layers](../../../docs/app/primitives.md#anchor-a-layer-to-an-element), maintained [layer example](../../../examples/probes/layer.tsrx), [web ownership regressions](../../../packages/ui/src/components/overlays/use-layer.web.test.tsrx), [geometry tests](../../../packages/ui/src/components/overlays/popover-position.test.ts), [Chromium CSS-length regression](../../../packages/ui/tests/layer-position.web.mjs), and [AppKit layer bridge tests](../../../packages/macos-renderer/test/layer.test.ts). These tests distinguish numeric geometry and lifecycle evidence from physical OS input.

- AC9: [macOS scrolling and refresh](../../../docs/app/primitives.md#macos-scrolling-and-refresh), [maintained macOS demo](../../../packages/demos/src/ScrollBoxDemo.macos.tsrx), [ref/callback/geometry component tests](../../../packages/ui/src/components/layout/scrollable-area-appkit.mobile.test.tsrx), [renderer geometry tests](../../../packages/macos-renderer/test/scroll-view.test.ts), and [AppKit host assertions](../../../packages/ui/tests/fixtures/scrollable-area.macos.tsrx) (`bun run --filter @octane-xplat/ui test:scroll:macos`). These establish lifecycle and geometry behavior; real AppKit trackpad/keyboard input requires separate target qualification.

- AC10: [Sheet forms and focus](../../../docs/app/software-keyboard.md#edit-a-form-in-a-sheet), [draft ownership](../../../docs/app/primitives.md#keep-drafts-when-switching-panels), and [native keyboard ownership](../keyboard.md#native-overlay-transform-ownership). Maintained [overlay journeys](../../../packages/ui/tests/fixtures/overlay-keyboard.ios.tsrx) cover mobile window geometry and lifecycle, with browser editing-state/focus and AppKit content-ownership counterparts; these are programmatic journeys, not OS-input qualification.

[Final keyboard qualification](../keyboard.md#final-workflow-qualification) separates
OS touch/typing in shared overlays from programmatic native-sheet, desktop, and
browser evidence. Physical keyboard and screen-reader navigation are not implied.

- AC11: [AppKit carousel guide](../../../docs/app/components.md#navigate-appkit-carousel-slides), private geometry adapter, five policy/three wiring/one motion-getter authored cases, [maintained fixture](../../../examples/probes/carousel.macos.tsrx), skill and [target note](../exploration.md#operational-evidence). All cases/fixture/package/native checks require separate execution evidence; snap source ownership follows AC12; fades remain a source gap.

- AC12: [AppKit snap guide](../../../docs/app/components.md#snap-appkit-carousel-slides-after-user-scrolling), private snap controller and geometry prerequisites, six policy/two geometry/two wiring authored cases, [extended maintained fixture](../../../examples/probes/carousel.macos.tsrx), skill and [target note](../exploration.md#operational-evidence). All cases/fixture/package/native qualification require separate execution evidence.

- AC13: [Lightbox gestures and limits](../../../docs/app/primitives.md#macos-shared-presentations), six [policy cases](../../../packages/ui/src/components/overlays/lightbox-gestures.macos.test.ts), one [mounted panel case](../../../packages/ui/src/components/overlays/lightbox-gestures.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/lightbox-gestures.macos.tsrx), skill and [target note](../exploration.md#operational-evidence).. The mounted case mocks presentation/layer/button boundaries; it does not qualify the native presentation or actual gesture/hit delivery. Video remains unsupported and every OS/AX/packing gate stays open.
