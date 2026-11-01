/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	ColorArea,
	ColorField,
	ColorPicker,
	ColorSlider,
	RichText,
	RichTextSpan,
	View,
} from '@octane-xplat/ui'

export const state: Record<string, any> = {
	areaChanges: [] as string[],
	areaEnd: null as string | null,
	sliderChanges: [] as string[],
	fieldCommit: null as string | null,
	pickerChanges: [] as string[],
	linkTaps: 0,
}

export function ColorsProbe() @{
	const [area, setArea] = useState('#ff0000')
	const [hue, setHue] = useState('#ff0000')
	const [field, setField] = useState('#0000ff')
	const [picker, setPicker] = useState('#ff0000')

	<View style={{ display: 'flex', flexDirection: 'column', width: 480 }}>
		<masonview
			onPan={(e: any) => {
				state.dbgPan = (state.dbgPan ?? '') + (e.state?.[0] ?? '?')
				if (e.state === 'moved') { state.dbgMoved = (state.dbgMoved ?? 0) + 1 }
			}}
		>
			<ColorArea
				id="area"
				style={{ width: 440, height: 160 }}
				value={area}
				onChange={(hex) => {
					setArea(hex)
					state.areaChanges.push(hex)
				}}
				onChangeEnd={(hex) => {
					state.areaEnd = hex
				}}
			/>
		</masonview>
		<ColorSlider
			id="hue"
			channel="hue"
			value={hue}
			onChange={(hex) => {
				setHue(hex)
				state.sliderChanges.push(hex)
			}}
		/>
		<ColorField
			id="cfield"
			label="Hex"
			value={field}
			onChange={(hex) => {
				setField(hex)
				state.fieldCommit = hex
			}}
		/>
		<ColorPicker
			id="picker"
			style={{ width: 440 }}
			value={picker}
			onChange={(hex) => {
				setPicker(hex)
				state.pickerChanges.push(hex)
			}}
		/>
		<RichText id="rich">
			<RichTextSpan text="PLAIN " />
			<RichTextSpan
				text="STYLED"
				style={{ fontWeight: 'bold', color: '#ff0000', fontStyle: 'italic' }}
			/>
			<RichTextSpan text=" UPPER" style={{ textTransform: 'uppercase' }} />
			<RichTextSpan
				text=" TAPPABLE"
				style={{ textDecoration: 'underline' }}
				onPress={() => {
					state.linkTaps += 1
				}}
			/>
		</RichText>
	</View>
}
