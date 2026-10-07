/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane';
import { Img } from '@nativescript-community/ui-image';
import type { AnimatedImageProps } from './props';
import { applyEscapeProps } from './escape-props';

// @nativescript-community/ui-image — Fresco DraweeView on Android,
// SDAnimatedImageView on iOS when `animatedImageView` is set (plain UIImageView
// otherwise, which would still decode but not animate).
registerElement('animatedimage', Img);

/** AnimatedImage — GIF/animated-webp decode + autoplay via ui-image. `src`
 *  takes the Img grammar: remote URL, res://name, ~/bundle path, file path.
 *  There is intentionally no play/pause prop — <img> can't pause on web, so
 *  the shared contract is always-playing. */
export function AnimatedImage(props: AnimatedImageProps) @{
	<animatedimage
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={props.className}
		style={props.style}
		src={props.src}
		stretch={props.stretch ?? 'aspectFit'}
		width={props.width}
		height={props.height}
		animatedImageView={true}
		autoPlayAnimations={true}
		accessibilityLabel={props.alt}
	/>
}
