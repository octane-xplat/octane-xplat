/** @jsxImportSource @nativescript-community/octane */
import type { AvatarProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Image } from './Image';

/** Avatar — circular image with a text fallback when `src` is absent.
 *  `size` sets the square + border-radius inline so the circle is identical
 *  across targets. */
export function Avatar(props: AvatarProps) @{
	const size = props.size ?? 32;
	const box = { width: size, height: size, borderRadius: size / 2 };

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-avatar', props.className)}
		style={{ ...props.style, ...box }}
		accessibilityLabel={props.alt}
	>
		{props.src
			? <Image className="vx-avatar-img" src={props.src} alt={props.alt} style={{ width: size, height: size, borderRadius: size / 2 }} />
			: <label className="vx-avatar-fallback" text={props.fallback ?? ''} />}
	</flexboxlayout>
}
