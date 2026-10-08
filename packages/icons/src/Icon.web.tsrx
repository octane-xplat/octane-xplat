import { useMemo } from 'octane';
import { useStore } from '@octane-xplat/ui';
import type { IconProps } from './props';
import { registry, resolveIcon } from './registry';
import { iconToSvg } from './svg';

/** Render a bundled icon as inline SVG; missing names render nothing. */
export function Icon(props: IconProps) @{
	useStore(registry);
	const icon = resolveIcon(props.name);

	const svg = useMemo(() => icon ? iconToSvg(icon, {
		size: props.size, color: props.color,
		rotate: props.rotate, hFlip: props.hFlip, vFlip: props.vFlip,
	}) : undefined, [icon, props.size, props.color, props.rotate, props.hFlip, props.vFlip]);

	if (!svg) return null;

	<svg id={props.id} className={props.className} viewBox={svg.viewBox}
		width={svg.width} height={svg.height} fill={props.color ?? 'currentColor'}
		style={{ display: 'inline-block', flexShrink: 0, color: props.color }}
		role={props.label ? 'img' : undefined} aria-label={props.label}
		aria-hidden={props.label ? undefined : 'true'}
		ref={(element: any) => { if (element) element.innerHTML = svg.body; }} />
}
