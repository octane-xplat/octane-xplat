import type { IconProps } from './props';
import { getIcon } from './icons';
import { useIconRegistry } from './icon-registry-context';
import { applyWebProps } from './platformProps.web';

const namedSizes: Record<string, number> = { xsm: 12, sm: 16, md: 20, lg: 24, xl: 32 };
const namedColors: Record<string, string> = {
	primary: 'var(--color-text)', secondary: 'var(--color-text-secondary)', tertiary: 'var(--color-text-tertiary, var(--color-text-secondary))',
	disabled: 'var(--color-text-disabled, var(--color-text-tertiary, #999))', accent: 'var(--color-text-accent, var(--color-accent))',
	success: 'var(--color-success)', error: 'var(--color-error)', warning: 'var(--color-warning)', inherit: 'inherit',
};

export function Icon(props: IconProps) @{
	const inheritedRegistry = useIconRegistry();
	const glyph = getIcon(props.name, props.registry ?? inheritedRegistry);
	if (!glyph) return null;
	const size = typeof props.size === 'number' ? props.size : namedSizes[props.size ?? 'lg'] ?? 24;
	const color = props.color != null ? namedColors[props.color] ?? props.color : undefined;
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
			style={color ? { color } : undefined}
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
				<path d={glyph.svg} fill={color ?? 'currentColor'} />
			</svg>
		} @else {
			@if (glyph.font) {
				<span
					id={props.id}
					className={['vx-icon', props.className]}
					role={labeled ? 'img' : undefined}
					aria-label={props.accessibilityLabel}
					aria-hidden={labeled ? undefined : 'true'}
					style={{ fontFamily: glyph.font.family, fontSize: size, color }}
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
							style={{ fontSize: size, color }}
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
