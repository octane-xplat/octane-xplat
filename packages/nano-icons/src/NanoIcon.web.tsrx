import { useMemo } from 'octane';
import { useStore } from '@octane-xplat/ui';
import { iconRegistry, resolveIcon } from '@octane-xplat/icons';
import type { NanoIconProps } from './props';
import { prepareNanoIcon } from './prepare';
import { materializeNanoIcon } from './materialize';

/**
 * Render a bundled icon as inline SVG with shared preparation: equal
 * (icon, size, transforms) inputs reuse one prepared body, and each live
 * instance still receives unique definition IDs. Missing names render nothing.
 */
export function NanoIcon(props: NanoIconProps) @{
	useStore(iconRegistry);
	const icon = resolveIcon(props.name);

	const prepared = useMemo(() => icon ? prepareNanoIcon(icon, {
		size: props.size, rotate: props.rotate, hFlip: props.hFlip, vFlip: props.vFlip,
	}) : undefined, [icon, props.size, props.rotate, props.hFlip, props.vFlip]);

	const svg = useMemo(() => prepared ? materializeNanoIcon(prepared, {
		color: props.color,
	}) : undefined, [prepared, props.color]);

	if (!svg) return null;

	<svg id={props.id} className={props.className} viewBox={svg.viewBox}
		width={svg.width} height={svg.height} fill={props.color ?? 'currentColor'}
		style={{ display: 'inline-block', flexShrink: 0, color: props.color }}
		role={props.label ? 'img' : undefined} aria-label={props.label}
		aria-hidden={props.label ? undefined : 'true'}
		ref={(element: any) => { if (element) element.innerHTML = svg.body; }} />
}
