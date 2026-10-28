# Lightbox

This package is a private implementation preview. The public package cutover
and macOS implementation are pending. Existing apps still use the Lightbox
exported by `@octane-xplat/ui`.

The preview has unresolved behavior gaps, including the native default
viewport and custom-slide opening lifecycle. The [source audit](UPSTREAM.md#unfinished-behavior-and-audit-findings)
records these gaps separately from intentional upstream adaptations.

Build a custom gallery with the headless parts. Each trigger opens its media
index; the viewport supplies image slides when you omit its children.

```tsx
import { Lightbox } from '@octane-xplat/lightbox'
import { Image, Text } from '@octane-xplat/ui'

const photos = [
	{ src: 'https://example.com/coast.jpg', alt: 'Rocky coast', width: 1200, height: 800 },
	{ src: 'https://example.com/forest.jpg', alt: 'Forest trail', width: 800, height: 1200 },
]

export function Gallery() {
	return (
		<Lightbox.Root media={photos}>
			<Lightbox.Trigger index={0}><Text>Open photos</Text></Lightbox.Trigger>
			<Lightbox.Popup>
				<Lightbox.Backdrop />
				<Lightbox.Viewport />
				<Lightbox.Close><Text>Close</Text></Lightbox.Close>
				<Lightbox.Thumbnails className="gallery-thumbnails">
					{photos.map((photo, index) => (
						<Lightbox.Thumbnail key={photo.src} index={index} className="gallery-thumbnail">
							<Image src={photo.src} alt={photo.alt} />
						</Lightbox.Thumbnail>
					))}
					<Lightbox.ThumbnailIndicator className="gallery-selection" />
				</Lightbox.Thumbnails>
			</Lightbox.Popup>
		</Lightbox.Root>
	)
}
```

Add these classes to the app stylesheet to size the strip and its buttons.

```css
.gallery-thumbnails { height: 64px; }
.gallery-thumbnail { width: 64px; height: 64px; overflow: hidden; }
.gallery-selection { border: 2px solid white; }
```

The indicator follows fractional paging progress, interpolating thumbnail
position and size. The strip scrolls to keep the selection visible. Style the
strip's placement with an app CSS class; the parts import their structural CSS.

```tsx
<Lightbox.Thumbnails className="gallery-thumbnails">
	<Lightbox.Thumbnail index={0}><Text>Coast</Text></Lightbox.Thumbnail>
	<Lightbox.Thumbnail index={1}><Text>Forest</Text></Lightbox.Thumbnail>
	<Lightbox.ThumbnailIndicator className="gallery-selection" />
</Lightbox.Thumbnails>
```

Native apps must initialize the gesture plugin before mounting the app. See
[gesture setup](../motion/README.md) and the existing app entry for where to
put initialization.

```ts
import { install } from '@nativescript-community/gesturehandler'

install()
```

Web has browser input coverage. Native thumbnail geometry shares the web
layout model; device input and layout qualification for the strip are pending.
The current iOS/Android runtime evidence covers the viewer and gestures before
this strip was added. See the [internal evidence record](../../.agents/docs/notes/lightbox-native.md).
