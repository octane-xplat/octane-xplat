/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ColorPickerProps } from './props'
import { ColorAreaView } from './ColorArea'
import { ColorSliderView } from './ColorSlider'
import { ColorField } from './ColorField'
import { ColorSwatch } from './ColorSwatch'
import { normalizeHex } from './color'
import { useColorState } from './color-state'

/** Fixed composite picker — ColorArea, hue ColorSlider, then a row of
 *  ColorSwatch + ColorField. One shared HSB state drives every part so the
 *  hue survives achromatic edits. React Aria's children-composition picker
 *  is deferred. */
export function ColorPicker(props: ColorPickerProps) {
	const color = useColorState(props, '#ff0000')
	return (
		<div
			id={props.id}
			data-testid={props.testID}
			className={['vx-color-picker', props.className]}
			style={typeof props.style === 'object' && props.style !== null ? props.style : undefined}
		>
			<ColorAreaView
				hsb={color.hsb}
				onHsb={color.set}
				onHsbEnd={color.end}
				isDisabled={props.isDisabled}
				testID={props.testID ? `${props.testID}.area` : undefined}
			/>
			<ColorSliderView
				hsb={color.hsb}
				onHsb={color.set}
				onHsbEnd={color.end}
				isDisabled={props.isDisabled}
				testID={props.testID ? `${props.testID}.hue` : undefined}
			/>
			<div className="vx-color-picker-row">
				<ColorSwatch
					color={color.hex}
					testID={props.testID ? `${props.testID}.swatch` : undefined}
				/>
				<ColorField
					value={color.hex}
					isDisabled={props.isDisabled}
					testID={props.testID ? `${props.testID}.field` : undefined}
					onChange={(hex) => {
						if (normalizeHex(hex)) {
							color.setHex(hex)
						}
					}}
					onChangeEnd={color.end}
				/>
			</div>
		</div>
	)
}
