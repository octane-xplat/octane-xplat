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
export function ColorPicker(props: ColorPickerProps): unknown @{
	const color = useColorState(props, '#ff0000')

	<masonview
		id={props.id}
		className={cx('vx-color-picker', props.className)}
		style={mergeStyle(
			{ display: 'flex', flexDirection: 'column', gap: 8 },
			styleRecord(props.style),
		)}
	>
		<ColorAreaView
			hsb={color.hsb}
			onHsb={color.set}
			onHsbEnd={color.end}
			isDisabled={props.isDisabled}
		/>
		<ColorSliderView
			hsb={color.hsb}
			onHsb={color.set}
			onHsbEnd={color.end}
			isDisabled={props.isDisabled}
		/>
		<masonview
			className="vx-color-picker-row"
			style={mergeStyle({ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' })}
		>
			<ColorSwatch color={color.hex} />
			<ColorField
				value={color.hex}
				isDisabled={props.isDisabled}
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
