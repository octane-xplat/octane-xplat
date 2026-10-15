/** @jsxImportSource @nativescript-community/octane */
import type { IconProps } from './props';
import { getIcon } from './icons';
import { useIconRegistry } from './icon-registry-context';
import { cx } from '@octane-xplat/lib';
import { applyNativeProps } from './platformProps';
import { glyphSvgMarkup, isSvgSrc, svgSource } from './svg';

/**
 * Renders a glyph registered via `registerIcons`. Import from `@octane-xplat/ui`.
 *
 * @see IconProps, IconGlyph, registerIcon.
 */
export function Icon(props: IconProps) @{
	const inheritedRegistry = useIconRegistry();
	const glyph = getIcon(props.name, props.registry ?? inheritedRegistry);
	if (!glyph) return null;
	const size = props.size ?? 24;
	const markup = glyphSvgMarkup(glyph, props.color);
	const accessible = props.accessibilityLabel != null;

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
				style={{ fontFamily: glyph.font.family, fontSize: size, color: props.color as any }}
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
						style={{ fontSize: size, color: props.color as any }}
						accessible={accessible}
						accessibilityLabel={props.accessibilityLabel}
						ref={(el: any) => applyNativeProps(el, props)}
					/>
				}
			}
		}
	}
}
