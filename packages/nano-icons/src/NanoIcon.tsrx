/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane';
import { Image, useStore } from '@octane-xplat/ui';
import { iconRegistry, resolveIcon } from '@octane-xplat/icons';
import type { NanoIconProps } from './props';
import { prepareNanoIcon } from './prepare';
import { materializeNanoIcon } from './materialize';

/**
 * Render a bundled icon through ui's vendored SVGView with shared preparation:
 * equal (icon, size, transforms) inputs reuse one prepared body, and tint-only
 * changes rematerialize without reparsing geometry. Missing names render
 * nothing.
 */
export function NanoIcon(props: NanoIconProps) @{
	useStore(iconRegistry);
	const icon = resolveIcon(props.name);

	const prepared = useMemo(() => icon ? prepareNanoIcon(icon, {
		size: props.size, rotate: props.rotate, hFlip: props.hFlip, vFlip: props.vFlip,
	}) : undefined, [icon, props.size, props.rotate, props.hFlip, props.vFlip]);

	const svg = useMemo(() => prepared ? materializeNanoIcon(prepared, {
		color: props.color ?? '#000000',
	}) : undefined, [prepared, props.color]);

	if (!svg) return null;

	<Image id={props.id} className={props.className} src={svg.markup}
		alt={props.label}
		ios={{ accessible: !!props.label, accessibilityRole: 'image' }}
		android={{ accessible: !!props.label, accessibilityRole: 'image' }}
		style={{ width: svg.width, height: svg.height }} />
}
