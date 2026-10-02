/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane';
import { Image, useStore } from '@octane-xplat/ui';
import type { IconProps } from './props';
import { registry, resolveIcon } from './registry';
import { iconToSvg } from './svg';

/** AppKit's renderer aliases the universal renderer entry and decodes SVG with NSImage. */
export function Icon(props: IconProps): unknown @{
	useStore(registry);
	const icon = resolveIcon(props.name);

	const image = useMemo(() => {
		if (!icon) return undefined;

		const svg = iconToSvg(icon, {
			size: props.size, color: props.color ?? '#000000',
			rotate: props.rotate, hFlip: props.hFlip, vFlip: props.vFlip,
		});

		return { src: svg.markup, width: svg.width, height: svg.height };
	}, [icon, props.size, props.color, props.rotate, props.hFlip, props.vFlip]);

	if (!image) return null;

	<Image id={props.id} className={props.className} src={image.src}
		alt={props.label ?? ''}
		style={{ width: image.width, height: image.height }} />
}
