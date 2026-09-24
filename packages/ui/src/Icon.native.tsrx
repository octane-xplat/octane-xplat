/** @jsxImportSource @nativescript-community/octane */
import type { IconProps } from './props';
import { getIcon } from './icons';
import { cx } from './cx';
import { applyNativeProps } from './platformProps.native';

export function Icon(props: IconProps) @{
	const glyph = getIcon(props.name);
	if (!glyph) return null;
	const size = props.size ?? 24;
	@if (glyph.text) {
		<label
			id={props.id}
			className={cx(props.className)}
			text={glyph.text}
			style={{ fontSize: size, color: props.color as any }}
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
				<image
					id={props.id}
					className={cx(props.className)}
					src={glyph.src}
					style={{ width: size, height: size }}
					ref={(el: any) => applyNativeProps(el, props)}
				/>
			}
		}
	}
}
