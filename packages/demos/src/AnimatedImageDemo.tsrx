import { AnimatedImage } from '@octane-xplat/gif';
import { Heading, Text, View } from '@octane-xplat/ui';

/** Shared `AnimatedImage` demo — GIF decode/autoplay via ui-image
 *  (Fresco/SDWebImage) on native, plain <img> on web. */
export function AnimatedImageDemo() @{
	<View className="gap-4">
		<Heading level={2}>Animated image</Heading>
		<Text>
			GIFs animate on every target — ui-image (Fresco/SDWebImage) on
			native, a plain img on web. The plugin arrives as a real dependency
			of @octane-xplat/gif, not an app-declared peer.
		</Text>
		<AnimatedImage
			id="animated-image"
			src="https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_(large).gif"
			alt="Rotating earth"
			width={160}
			height={160}
		/>
	</View>
}
