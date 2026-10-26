/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle, styleRecord } from './style-merge'
import type { AvatarProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Image } from './Image.macos.tsrx';

/** Avatar — circular image with a text fallback when `src` is absent.
 *  `size` sets the square + border-radius inline so the circle is identical
 *  across targets. */
export function Avatar(props: AvatarProps) @{
	const size = typeof props.size === 'number' ? props.size : ({ xsm: 16, sm: 24, md: 32, lg: 40, xl: 48 } as Record<string, number>)[props.size ?? 'md'] ?? 32;
	const box = { width: size, height: size, borderRadius: size / 2 };

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-avatar', props.className)} style={mergeStyle({display: "flex"}, { ...styleRecord(props.style), ...(box) })} accessibilityLabel={props.alt}>
		{props.src
			? <Image className="vx-avatar-img" src={props.src} alt={props.alt} style={{ width: size, height: size, borderRadius: size / 2 }} />
			: <label className="vx-avatar-fallback" text={props.fallback ?? ''} />}
	</masonview>
}

// AvatarStatusDot has no AppKit-specific leaf yet; reuse the shared
// implementation so the barrel resolves.
export { AvatarStatusDot } from "./Avatar.tsrx";
