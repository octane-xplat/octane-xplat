/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle, styleRecord } from './style-merge'
import type { ColorPickerProps } from './props';
import { cx } from '@octane-xplat/lib';
import { ColorAreaView } from './ColorArea';
import { ColorSliderView } from './ColorSlider';
import { ColorField } from './ColorField';
import { ColorSwatch } from './ColorSwatch';
import { normalizeHex } from './color';
import { useColorState } from './color-state';

/** Fixed composite picker — ColorArea, hue ColorSlider, then a row of
 *  ColorSwatch + ColorField. One shared HSB state drives every part so the
 *  hue survives achromatic edits. React Aria's children-composition picker
 *  is deferred. */
export function ColorPicker(props: ColorPickerProps) @{
	const color = useColorState(props, '#ff0000');
	<masonview id={props.id} className={cx('vx-color-picker', props.className)} style={mergeStyle({display: "flex"}, styleRecord(props.style))}>
		<ColorAreaView hsb={color.hsb} onHsb={color.set} onHsbEnd={color.end} isDisabled={props.isDisabled} />
		<ColorSliderView hsb={color.hsb} onHsb={color.set} onHsbEnd={color.end} isDisabled={props.isDisabled} />
		<masonview className="vx-color-picker-row" style={mergeStyle({display: "flex"})}>
			<ColorSwatch color={color.hex} />
			<ColorField
				value={color.hex}
				isDisabled={props.isDisabled}
				onChange={(hex) => { if (normalizeHex(hex)) color.setHex(hex) }}
				onChangeEnd={color.end}
			/>
		</masonview>
	</masonview>
}
