/** @jsxImportSource @nativescript-community/octane */
import type { IconProps } from './props';
import { getIcon } from './icons';
import { cx } from './cx';
import { applyNativeProps } from './platformProps.native';
import { glyphSvgMarkup, isSvgSrc, svgSource } from './svg.native';

export function Icon(props: IconProps) @{
	const glyph = getIcon(props.name);
	if (!glyph) return null;
	const size = props.size ?? 24;
	const markup = glyphSvgMarkup(glyph, props.color);

	@if (markup) {
		<svgview
			id={props.id}
			className={cx(props.className)}
			src={markup}
			stretch="aspectFit"
			style={{ width: size, height: size }}
			ref={(el: any) => applyNativeProps(el, props)}
		/>
	} @else {
		@if (glyph.font) {
			<label
				id={props.id}
				className={cx(props.className)}
				text={glyph.font.glyph}
				style={{ fontFamily: glyph.font.family, fontSize: size, color: props.color as any }}
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
						ref={(el: any) => applyNativeProps(el, props)}
					/>
				} @else {
					<image
						id={props.id}
						className={cx(props.className)}
						src={glyph.src}
						style={{ width: size, height: size }}
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
						ref={(el: any) => applyNativeProps(el, props)}
					/>
				}
			}
		}
	}
}
