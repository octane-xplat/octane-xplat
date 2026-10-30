# Images, video, and paged media

Use for AppKit image/video leaves, Lightbox, Carousel/Pager, and file filters. Match each feature to its declared host; see the [task index](../primitives.md) for shared contracts.

## Native macOS images

AppKit `Image` preserves shared layout props, composed classes and style forms.
The optional image package now delegates to the core leaf. Use local placeholders and the shared fit/position props. AppKit now draws
clipped fit rectangles in native logical points, including cover and corner/
percentage offsets. Raw CSS position parsing accepts keywords/px/percentages;
other units or unresolved expressions center with a warning. Resolution candidates use the shared closest-pixel-count rule on box/window-density
changes (use a stable styled box); decode hints remain unimplemented; native cropping/orientation/density are unqualified. The
renderer shares bounded decoded images and cancels pending work after its last
subscriber leaves; HTTP error payloads are rejected and remote delivery enters
the main operation queue. Native timing, rendering and packaging are unqualified.
The optional package now has source-only HTTP(S) byte prefetch, memory/disk
query, eviction and clear through an image-owned disk cache; native qualification
is pending. It uses a credential-free dedicated session. Prefetch headers and
uncacheable responses resolve false. Configuration fields and display headers throw; cachePolicy="none" now has the
matched UI/renderer bypass path below. Decode-
transform queries return none. Load/error callbacks now have the matched
UI/renderer handoff; other engine props remain gaps. The
private imageMemoryCache bridge controls decoded memory only; do not substitute
it for public disk eviction or an account-data purge. Read the
[cache subset](../../../../../packages/image/README.md#appkit-subset) before relying on it.
See [AppKit image loading](../../../../../docs/app/components.md#image-loading-on-appkit).

```tsx
import { Image } from '@octane-xplat/ui'

export function Photo({ src }: { src: string }) {
	return <Image src={src} alt="Photo" flexGrow={1} contentFit="contain"
		className={['photo', { framed: true }]} style={{ width: 120, height: 80 }} />
}
```

```ts
import { prefetch, isImageCached, evictImage, clearImageCaches } from '@octane-xplat/image'
const src = 'https://example.com/photo.png'
console.log(await prefetch(src), (await isImageCached(src))[src])
await evictImage(src)
await clearImageCaches()
```

For the optional Image, cachePolicy="none" now bypasses framework memory/owned
disk caches. A private per-view handoff retains CoreImage normalization; matching
UI and renderer capabilities are required or it fails before loading. Bypass
work shares only with bypass consumers; mode changes retire old callbacks for
the same URI. This does not purge older entries or platform-internal caches.
Optional onLoad/onError also require matching UI/renderer support. Current
source/mode ownership and root-scope guards retire stale notifications; the
latest handler receives at most one deferred terminal event. Placeholder-only
updates retain work and emit no event; empty sources emit no event. Dimensions
are the largest positive native representation in pixels, or 0×0 if unknown,
never points; source reports request origin, not live cache state. Generic
errors omit URI/NSError details. Adding handlers after completion does not replay.
Native event timing, metadata, cache behavior and retention require separate target qualification.

```tsx
import { Image } from '@octane-xplat/image'
export function FreshPhoto({ src }: { src: string }) {
	return <Image src={src} cachePolicy="none" alt="Photo" style={{ width: 120, height: 80 }}
		onLoad={(event) => console.log(event.width, event.height, event.source)}
		onError={({ error }) => console.warn(error.message)} />
}
```

## AppKit video source subset

Video now selects a package-owned Swift NSView/AVPlayerLayer surface with shared
VideoChrome. Rebuild the AppKit app after adding the package; missing bridge
setup fails before mounting. Sources are HTTP(S), absolute/file URLs or ~/ bundle
paths. Commands/events use milliseconds; unknown duration is zero. Source/seek
ownership retires old work; explicit play retries failure, same-prop renders do
not. Pre-ready seeks retain the last finite target. Loop suppresses onEnded and
detach pauses native playback. Handle.native is the current NSView; disposed
handles are inert. AppKit onError is generic, unlike the mobile plugin gap.

```tsx
import { Video } from '@octane-xplat/video'
export function Clip({ source }: { source: string }) {
	return <Video src={source} controls style={{ width: 320, height: 220 }}
		onReady={({ duration }) => console.log(duration)} onError={({ message }) => console.warn(message)} />
}
```

Owner callbacks use latest props and source generations; ready is metadata and
playing-change is intent, not rendered frames. Polling is 250 ms for active work,
1 s for paused ready playback only when onError is installed. No ios/android/web
escape bag applies to AppKit. Nine owner cases and target fixture require separate verification;
Swift/discovery, playback/audio, callbacks/threads, fit/resize, input/AX, resource
lifetime and packaging require separate target qualification. Do not infer Lightbox integration,
DRM, subtitles, background or full streaming support. Read the
[package subset](../../../../../packages/video/README.md#experimental-appkit-playback).

## AppKit Carousel native geometry controls

Carousel now delivers its existing handle and optional native overlay buttons.
Current NSScrollView clip/document metrics drive viewport paging, clamped indexed
slide conversion, edge/capability state and hasLoop wrapping. Proportional slides
use measured viewport widths and explicit track extent including gaps. Child
normalization and labels remain; dynamic slides keep intrinsic sizing. Logical
RTL conversion/leading-edge alignment and row/button direction share useDirection.
Invalid, hidden and detached views cannot scroll. Existing AppKit offset and
reduced-motion helpers own native requests; the motion reader accepts property
and receiver-bound callable getter forms. Refs, scroll/layout and window updates
keep measurements current without polling; teardown invalidates held handles.

```tsx
import { useRef } from 'octane'
import { Carousel, Button, Text } from '@octane-xplat/ui'
import type { CarouselHandle } from '@octane-xplat/ui'

export function Previews() {
	const carousel = useRef<CarouselHandle | null>(null)
	return <>
		<Carousel ref={carousel} label="Previews" hasButtons hasLoop variant="proportional" style={{ width: 320, height: 120 }}>
			<Text>First</Text><Text>Second</Text>
		</Carousel>
		<Button label="Next" clickAction={() => carousel.current?.scrollNext()} />
	</>
}
```

 Native sizing, RTL/initial alignment, animation/input/overlay hit testing,
keyboard/AX/resize and packaging require separate target qualification. Snap ownership follows below; edge fades remain
a source gap. See [AppKit carousel navigation](../../../../../docs/app/components.md#navigate-appkit-carousel-slides).

## AppKit Carousel user-scroll snap ownership

hasSnap now uses NSScrollView WillStartLiveScroll/DidLiveScroll/DidEndLiveScroll
notifications, scoped to the current viewport/window. Tracking holds off snap;
end/unbracketed user events use a trailing 140 ms quiet period. The SDK explicitly
allows unbracketed legacy-mouse updates. Generic onScroll/native animation bounds
changes never arm snap. Current clamped nearest-edge geometry, RTL/reduced motion
and vertical preservation reuse the existing adapter. Programmatic moves,
meaningful layout/cell changes, flag disablement and hidden/moved/detached scopes
cancel stale work. Partial subscription failure releases prior tokens; teardown
releases tokens/timers. User/handle intent retires late initial alignment.

```tsx
<Carousel label="Previews" hasButtons hasSnap variant="proportional" style={{ width: 320, height: 120 }}>
	<Text>First</Text><Text>Second</Text>
</Carousel>
```

Six policy/two geometry/two wiring additions and the extended fixture require separate verification, alongside earlier cases. Native live/momentum ordering, wheel/trackpad/
scroller/keyboard delivery, layout/RTL/animation/AX and packaging are unqualified.
Missing live-scroll observation does not promise snap; edge fades remain a gap.
See [AppKit snap](../../../../../docs/app/components.md#snap-appkit-carousel-slides-after-user-scrolling).

## Experimental AppKit Pager

For small onboarding/gallery flows, Pager's macOS leaf now composes the public
AppKit ScrollableArea. Set an explicit size; all pages render eagerly. Requires
UI >=0.18.0 <1. defaultPage seeds once; page owns controlled state. User changes
report only after native position settles on a page boundary; programmatic
writes do not echo. Direction uses UI context and motion reads NSWorkspace's
native preference directly (AppKit useMediaQuery does not support a
prefers-reduced-motion query). Source/state/event/object-driver cases and the
manual fixture are authored. Native sizing/RTL, scroll/momentum,
ref/context ordering, focus/AX and packaged resolution require separate target qualification.

```tsx
import { Pager } from '@octane-xplat/pager'
import { Text } from '@octane-xplat/ui'
export function TravelPages() {
	return <Pager items={['Pack', 'Travel']} defaultPage={1}
		style={{ width: 320, height: 160 }} renderItem={(title) => <Text>{title}</Text>} />
}
```

Read the [package guide](../../../../../packages/pager/README.md#platform-support)
and [AppKit recipe](../../../../docs/recipes/appkit-paging.md) before promising native
paging support. The mobile plugin is not imported by the macOS leaf; its existing
package dependency remains. Do not add macOS to qualified parity targets from
source/mock evidence.

## AppKit Lightbox image gestures

Lightbox now has source paths for immediate double-click 1×/2× image zoom and
unzoomed pointer/recognized-AppKit-swipe navigation. hasZoom=false disables image
magnification; current source/index/viewport/policy changes reset to 1×. Pinch
bounds remain 1×–4×. Swipes clamp at gallery edges and skip vertical/cancelled/incomplete
recognized gestures and navigation while zoomed. Native panning still needs
qualification. Native Swipe
events use +deltaX for left; renderer pointer swipes already use direction 2 for
left. The local monitor owns only the open media stage, checks native window/hit
ownership, leaves ordinary scroll-wheel events alone and retires on replacement
or disposal. It requires native monitor support. Seven policy/mounted cases and
a manual fixture require separate verification; actual input/gesture arbitration,
hit/zoom coordinates, cleanup, VoiceOver and packaging require separate target qualification.
Lightbox retains the renderer's native AVPlayerView video path, including
`hasAutoPlay`. It is separate from the optional Video package's owned Swift
surface; decoding, playback, transport input and cleanup require separate target qualification.

```tsx
import { Lightbox } from '@octane-xplat/ui'
export function Gallery({ open, setOpen, first, second }: {
	open: boolean; setOpen: (open: boolean) => void; first: string; second: string
}) {
	return <Lightbox isOpen={open} onOpenChange={setOpen} hasZoom
		media={[{ src: first, alt: 'First photo' }, { src: second, alt: 'Second photo' }]} />
}
```

## Animated images on AppKit

Use the optional GIF package and rebuild the app's native host to include its
NSImageView bridge. The AppKit leaf now has source loading/animation and four
centered fit paths instead of a placeholder; actual native compilation,
GIF timing/looping and WebP decoding require separate target qualification. Give it an explicit
size. Source replacement drops stale work, hidden/detached views and reduced
motion stop progression, and unmount releases the request/image/observer.
There is no shared GIF prefetch cache (`prefetch` remains false), custom header
or mobile escape-bag support. Do not infer animated-image support from the core
static Image cache. See the [package subset](../../../../../packages/gif/README.md#experimental-appkit-subset).

```tsx
import { AnimatedImage } from '@octane-xplat/gif'
<AnimatedImage src="~/loading.gif" alt="Loading illustration" width={160} height={120} />
```

## AppKit file type filters and MIME hints

Use the existing files leaf for attachment flows. AppKit resolves image/audio/
video/text wildcard families through native type groups and concrete MIME through
registered UTType results, retaining known-extension fallbacks. Resolve every
member before presentation: unknown/malformed restrictions reject with
UnsupportedFileTypeError rather than dropping members or opening unrestricted.
Empty or */* means any type, including */* in a mixed list; clear reused panel filters.
Prefer explicit extensions for unregistered formats. Modern content-type arrays
require a complete resolution; partial resolution retains the full legacy
extension/UTI union. Load only UniformTypeIdentifiers before a lazy UTType global;
never import the entire generated native SDK merely to load this framework.

```ts
// FileActions.macos.ts
import { files } from '@octane-xplat/files'
export async function chooseDocuments() {
	return files.pickMultiple('.pdf,.docx')
}
export async function chooseImagesOrPDF() {
	return files.pickMultiple('image/*,.pdf')
}
```

Default FileInput metadata uses requested known concrete aliases first, otherwise
same-native-type aliases/preferred filename MIME, then finite hints; preserve
supplied metadata. Never relabel a concrete image as a broad supertype solely
because it conforms. Missing MIME can fail current accept validation. Panel
conformance/aliases and field validation are separate; neither inspects bytes.
Eighteen new parser/loader/panel/metadata/controller cases and the extended idle
fileinput-drop fixture remain UNRUN. No dependency/public type/React Aria presence
change. Native loading/type arrays/conformance, sandbox/ref lifecycle, OS picking/
dragging, focus/VoiceOver and installed/visual qualification remain pending. See
[file filter workflow](../../../../../docs/platform/date-picker.md#choose-file-types-on-appkit)
and [metadata](../../../../../packages/files/README.md#appkit-file-metadata).
