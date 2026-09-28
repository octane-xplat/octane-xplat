/** @jsxImportSource @xplat/macos/renderer */
import type { ActivityIndicatorProps, ButtonProps, CheckboxProps, SegmentedControlProps, SliderProps, SwitchProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { cx } from './cx'

export function Button(props: ButtonProps) @{
	<Pressable id={props.id} className={cx('vx-button', props.className)} style={props.style} disabled={props.disabled} onPress={props.onPress}>
		{props.children ?? <Text>{props.title}</Text>}
	</Pressable>
}

export function Checkbox(props: CheckboxProps) @{
	<switch id={props.id} checked={props.checked} onCheckedChange={props.onCheckedChange} className={props.className} style={props.style} />
}

export function Switch(props: SwitchProps) @{
	<switch id={props.id} checked={props.checked} onCheckedChange={props.onCheckedChange} className={props.className} style={props.style} />
}

export function Slider(props: SliderProps) @{
	<slider id={props.id} value={props.value} minValue={props.min} maxValue={props.max} onValueChange={props.onValueChange} className={props.className} style={props.style} />
}

export function SegmentedControl(_props: SegmentedControlProps) @{
	<label className="vx-unsupported">Segmented control is unsupported by the AppKit host</label>
}

export function SearchInput(props: any) @{
	<TextInput {...props} placeholder={props.placeholder ?? 'Search'} />
}

export function ActivityIndicator(_props: ActivityIndicatorProps) @{
	<label>Loading…</label>
}
