import type { IconProps } from './props';
import { getIcon } from './icons';
import { useIconRegistry } from './icon-registry-context';
import { applyWebProps } from './platformProps.web';

export function Icon(props: IconProps) @{
	const inheritedRegistry = useIconRegistry();
	const glyph = getIcon(props.name, props.registry ?? inheritedRegistry);
	if (!glyph) return null;
	const size = props.size ?? 24;
	const labeled = props.accessibilityLabel != null;

	@if (glyph.markup) {
		<svg
			id={props.id}
			className={['vx-icon', props.className]}
			viewBox={glyph.viewBox ?? '0 0 24 24'}
			width={size}
			height={size}
			role={labeled ? 'img' : undefined}
			aria-label={props.accessibilityLabel}
			aria-hidden={labeled ? undefined : 'true'}
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
				viewBox={glyph.viewBox ?? '0 0 24 24'}
				width={size}
				height={size}
				role={labeled ? 'img' : undefined}
				aria-label={props.accessibilityLabel}
				aria-hidden={labeled ? undefined : 'true'}
				ref={(el: any) => applyWebProps(el, props.web)}
			>
				<path d={glyph.svg} fill={props.color ?? 'currentColor'} />
			</svg>
		} @else {
			@if (glyph.font) {
				<span
					id={props.id}
					className={['vx-icon', props.className]}
					role={labeled ? 'img' : undefined}
					aria-label={props.accessibilityLabel}
					aria-hidden={labeled ? undefined : 'true'}
					style={{ fontFamily: glyph.font.family, fontSize: size, color: props.color }}
					ref={(el: any) => applyWebProps(el, props.web)}
				>
					{glyph.font.glyph}
				</span>
			} @else {
				@if (glyph.src) {
					<img
						id={props.id}
						className={['vx-icon', props.className]}
						src={glyph.src}
						width={size}
						height={size}
						alt={props.accessibilityLabel ?? ''}
						ref={(el: any) => applyWebProps(el, props.web)}
					/>
				} @else {
					@if (glyph.text) {
						<span
							id={props.id}
							className={['vx-icon', props.className]}
							role={labeled ? 'img' : undefined}
							aria-label={props.accessibilityLabel}
							aria-hidden={labeled ? undefined : 'true'}
							style={{ fontSize: size, color: props.color }}
							ref={(el: any) => applyWebProps(el, props.web)}
						>
							{glyph.text}
						</span>
					}
				}
			}
		}
	}
}
