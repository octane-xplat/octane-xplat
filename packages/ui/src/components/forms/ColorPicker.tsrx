/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { ColorPickerProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { ColorAreaView } from './ColorArea'
import { ColorSliderView } from './ColorSlider'
import { ColorField } from './ColorField'
import { ColorSwatch } from './ColorSwatch'
import { normalizeHex } from '../../theme/color'
import { useColorState } from '../../theme/color-state'

/** Fixed composite picker — ColorArea, hue ColorSlider, then a row of
 *  ColorSwatch + ColorField. One shared HSB state drives every part so the
 *  hue survives achromatic edits. React Aria's children-composition picker
 *  is deferred. */
export function ColorPicker(props: ColorPickerProps) @{
	const color = useColorState(props, '#ff0000')

	<masonview
		id={props.id}
		testID={props.testID}
		className={cx('vx-color-picker', props.className)}
		style={mergeStyle({ display: 'flex' }, styleRecord(props.style))}
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
		<masonview className="vx-color-picker-row" style={mergeStyle({ display: 'flex' })}>
			<ColorSwatch color={color.hex} testID={props.testID ? `${props.testID}.swatch` : undefined} />
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
		</masonview>
	</masonview>
}
