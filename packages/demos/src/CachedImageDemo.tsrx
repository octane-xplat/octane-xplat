import { Image, isImageCached, prefetch } from '@octane-xplat/image';
import { Button, Heading, Text, View } from '@octane-xplat/ui';
import { useState } from 'octane';

const PHOTOS = [
	'https://picsum.photos/seed/octane-1/600/400',
	'https://picsum.photos/seed/octane-2/600/400',
	'https://picsum.photos/seed/octane-3/600/400',
] as const;

/** Shared `Image` demo — Glide/SDWebImage engine via ui-image on native,
 *  plain <img> on web. `onLoad`'s `source` field reports which cache level
 *  served each bitmap (memory/disk/network) — the evidence that the engine,
 *  not NS core's 5 MB LruCache, is loading. */
export function CachedImageDemo() @{
	const [status, setStatus] = useState('waiting for first load…');
	const [cached, setCached] = useState('');

	<View className="gap-4">
		<Heading level={2}>Cached image</Heading>
		<Text>
			Remote images load through ui-image (Glide/SDWebImage) on native —
			a sized LRU + bitmap pool instead of the core 5 MB cache. The
			plugin arrives as a real dependency of @octane-xplat/image.
		</Text>
		@for (const url of PHOTOS; key url) {
			<Image
				src={url}
				alt="picsum sample"
				contentFit="cover"
				style={{ width: '100%', height: 140 }}
				onLoad={(e) => setStatus(`loaded ${e.width}×${e.height} via ${e.source ?? 'browser'}`)}
			/>
		}
		<Text>{status}</Text>
		<Button
			label="Prefetch first image, then report its cache level"
			onPress={() => {
				void prefetch(PHOTOS[0]).then(() =>
					isImageCached(PHOTOS[0]).then((state) => setCached(`cache state: ${state}`)),
				);
			}}
		/>
		{cached ? <Text>{cached}</Text> : null}
	</View>
}
