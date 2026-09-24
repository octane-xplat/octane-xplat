import type { IconProps } from './props';
import { getIcon } from './icons';
import { applyWebProps } from './platformProps.web';

export function Icon(props: IconProps) @{
	const glyph = getIcon(props.name);
	if (!glyph) return null;
	const size = props.size ?? 24;

	@if (glyph.markup) {
		<svg
			id={props.id}
			className={['vx-icon', props.className]}
			viewBox={glyph.viewBox ?? '0 0 24 24'}
			width={size}
			height={size}
			aria-hidden="true"
			style={props.color ? { color: props.color } : undefined}
			ref={(el: any) => {
				if (el) el.innerHTML = glyph.markup;
				applyWebProps(el, props.web);
			}}
		></svg>
	} @else {
		@if (glyph.svg) {
			<svg
				id={props.id}
				className={['vx-icon', props.className]}
				viewBox="0 0 24 24"
				width={size}
				height={size}
				aria-hidden="true"
				ref={(el: any) => applyWebProps(el, props.web)}
			>
				<path d={glyph.svg} fill={props.color ?? 'currentColor'} />
			</svg>
		} @else {
			@if (glyph.src) {
				<img
					id={props.id}
					className={['vx-icon', props.className]}
					src={glyph.src}
					width={size}
					height={size}
					alt={props.name}
					ref={(el: any) => applyWebProps(el, props.web)}
				/>
			}
		}
	}
}
