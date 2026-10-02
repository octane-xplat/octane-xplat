/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane';
import { Image, useStore } from '@octane-xplat/ui';
import type { IconProps } from './props';
import { registry, resolveIcon } from './registry';
import { iconToSvg } from './svg';

/** Render a bundled icon through ui's vendored SVGView; missing names render nothing. */
export function Icon(props: IconProps): unknown @{
	useStore(registry);
	const icon = resolveIcon(props.name);

	const svg = useMemo(() => icon ? iconToSvg(icon, {
		size: props.size, color: props.color ?? '#000000',
		rotate: props.rotate, hFlip: props.hFlip, vFlip: props.vFlip,
	}) : undefined, [icon, props.size, props.color, props.rotate, props.hFlip, props.vFlip]);

	if (!svg) return null;

	<Image id={props.id} className={props.className} src={svg.markup}
		alt={props.label}
		ios={{ accessible: !!props.label, accessibilityRole: 'image' }}
		android={{ accessible: !!props.label, accessibilityRole: 'image' }}
		style={{ width: svg.width, height: svg.height }} />
}
