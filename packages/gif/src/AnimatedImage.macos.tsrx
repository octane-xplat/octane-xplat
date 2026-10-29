/** @jsxImportSource @octane-xplat/jsx */
import type { AnimatedImageProps } from './props'

/** AnimatedImage — the AppKit host's `animatedimage` element: an NSImageView
 *  with `animates` on, so a decoded GIF plays itself (the shared contract is
 *  always-playing — there is intentionally no play/pause prop). `src` uses
 *  the core image grammar: remote URL, res://name, ~/bundle path, file path,
 *  base64 data URI. `stretch` maps to NSImageScaling; 'aspectFill' degrades
 *  to proportionally-down because AppKit has no crop mode. `width`/`height`
 *  arrive through style, same as the class-driven hosts. */
export function AnimatedImage(props: AnimatedImageProps) @{
	<animatedimage
		id={props.id}
		className={props.className}
		style={{
			...(props.width !== undefined ? { width: props.width } : null),
			...(props.height !== undefined ? { height: props.height } : null),
			...(typeof props.style === 'object' ? props.style : null),
		}}
		src={props.src}
		stretch={props.stretch ?? 'aspectFit'}
		autoPlayAnimations={true}
		accessibilityLabel={props.alt}
	/>
}
