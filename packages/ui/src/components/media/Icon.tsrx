/** @jsxImportSource @octane-xplat/jsx */
import type { IconProps } from '../../props'
import { getIcon } from './icons'
import { useIconRegistry } from './icon-registry-context'
import { cx } from '@octane-xplat/lib'
import { applyNativeProps } from '../../internal/platform/platformProps'
import { glyphSvgMarkup, isSvgSrc, svgSource } from './svg'

/**
 * Renders a glyph registered via `registerIcons`. Import from `@octane-xplat/ui`.
 *
 * @see IconProps, IconGlyph, registerIcon.
 */
const namedSizes: Record<string, number> = { xsm: 12, sm: 16, md: 20, lg: 24, xl: 32 }
const namedColors: Record<string, string> = {
	primary: 'var(--color-text)',
	secondary: 'var(--color-text-secondary)',
	tertiary: 'var(--color-text-tertiary)',
	disabled: 'var(--color-text-disabled)',
	accent: 'var(--color-accent)',
	success: 'var(--color-success)',
	error: 'var(--color-error)',
	warning: 'var(--color-warning)',
	inherit: 'inherit',
}

/** Named icon glyph rendered at the requested size and tone. */
export function Icon(props: IconProps): unknown @{
	const inheritedRegistry = useIconRegistry()
	const glyph = getIcon(props.name, props.registry ?? inheritedRegistry)
	if (!glyph) {
		return null
	}

	const size = typeof props.size === 'number' ? props.size : (namedSizes[props.size ?? 'lg'] ?? 24)
	const color = props.color != null ? (namedColors[props.color] ?? props.color) : undefined
	const markup = glyphSvgMarkup(glyph, color)
	const accessible = props.accessibilityLabel != null

	@if (markup) {
		<svgview
			id={props.id}
			className={cx(props.className)}
			src={markup}
			stretch="aspectFit"
			style={{ width: size, height: size }}
			accessible={accessible}
			accessibilityLabel={props.accessibilityLabel}
			ref={(el: any) => applyNativeProps(el, props)}
		/>
	} @else {
		@if (glyph.font) {
			<label
				id={props.id}
				className={cx(props.className)}
				text={glyph.font.glyph}
				style={{ fontFamily: glyph.font.family, fontSize: size, color: color }}
				accessible={accessible}
				accessibilityLabel={props.accessibilityLabel}
				ref={(el: any) => applyNativeProps(el, props)}
			/>
		} @else {
			@if (glyph.src) {
				@if (isSvgSrc(glyph.src)) {
					<svgview
						id={props.id}
						className={cx(props.className)}
						src={svgSource(glyph.src)}
						stretch="aspectFit"
						style={{ width: size, height: size }}
						accessible={accessible}
						accessibilityLabel={props.accessibilityLabel}
						ref={(el: any) => applyNativeProps(el, props)}
					/>
				} @else {
					<image
						id={props.id}
						className={cx(props.className)}
						src={glyph.src}
						style={{ width: size, height: size }}
						accessible={accessible}
						accessibilityLabel={props.accessibilityLabel}
						ref={(el: any) => applyNativeProps(el, props)}
					/>
				}
			} @else {
				@if (glyph.text) {
					<label
						id={props.id}
						className={cx(props.className)}
						text={glyph.text}
						style={{ fontSize: size, color: color }}
						accessible={accessible}
						accessibilityLabel={props.accessibilityLabel}
						ref={(el: any) => applyNativeProps(el, props)}
					/>
				}
			}
		}
	}
}
