/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane';
import { Image, useStore } from '@octane-xplat/ui';
import { iconRegistry, resolveIcon } from '@octane-xplat/icons';
import type { NanoIconProps } from './props';
import { prepareNanoIcon } from './prepare';
import { materializeNanoIcon } from './materialize';
import { svgDataUri } from './svg-data-uri.macos';

/** AppKit's renderer decodes SVG with NSImage; identical markup reuses its shared decode cache. */
export function NanoIcon(props: NanoIconProps) @{
	useStore(iconRegistry);
	const icon = resolveIcon(props.name);

	const image = useMemo(() => {
		if (!icon) return undefined;

		const svg = materializeNanoIcon(prepareNanoIcon(icon, {
			size: props.size, rotate: props.rotate, hFlip: props.hFlip, vFlip: props.vFlip,
		}), { color: props.color ?? '#000000' });

		return { src: svgDataUri(svg.markup), width: svg.width, height: svg.height };
	}, [icon, props.size, props.color, props.rotate, props.hFlip, props.vFlip]);

	if (!image) return null;

	<Image id={props.id} className={props.className} src={image.src}
		alt={props.label ?? ''}
		style={{ width: image.width, height: image.height }} />
}
