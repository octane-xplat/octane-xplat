/** @jsxImportSource @xplat/macos/renderer */
import { useRef, useState } from 'octane'
import type { ActivityIndicatorProps, ButtonProps, CheckboxProps, PanEvent, SegmentedControlProps, SliderProps, SwitchProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { cx } from './cx'
import { usePan } from './pan.tsrx'
import { nativeAccessibilityRole } from './escape-props'
import { useThemeScheme } from './theme/theme-scheme.macos'

function controlColors(dark: boolean) {
	return dark
		? { border: '#2e2e2e', onPrimary: '#171717', primary: '#ededed', surface: '#0a0a0a' }
		: { border: '#eaeaea', onPrimary: '#fafafa', primary: '#171717', surface: '#ffffff' }
}

export function Button(props: ButtonProps) @{
	<Pressable id={props.id} className={cx('vx-button', props.className)} style={props.style} disabled={props.disabled} onPress={props.onPress}>
		{props.children ?? <Text>{props.title}</Text>}
	</Pressable>
}

export function Checkbox(props: CheckboxProps) @{
	const checked = props.checked ?? false
	const colors = controlColors(useThemeScheme() === 'dark')
	<flexboxlayout
		id={props.id}
		flexDirection="row"
		alignItems="center"
		gap={props.label == null ? 0 : 8}
		className={cx('vx-checkbox-row', checked && 'vx-checkbox--on', props.disabled && 'vx-checkbox--disabled', props.className)}
		style={{ opacity: props.disabled ? 0.5 : 1, ...props.style }}
		accessibilityRole="checkbox"
		accessibilityLabel={props.accessibilityLabel}
		accessibilityState={{ checked, disabled: props.disabled ?? false }}
		onTap={props.disabled ? undefined : () => props.onCheckedChange?.(!checked)}
	>
		<flexboxlayout
			className="vx-checkbox"
			alignItems="center"
			justifyContent="center"
			style={{
				width: 20,
				height: 20,
				borderWidth: 1,
				borderColor: checked ? colors.primary : colors.border,
				borderRadius: 6,
				...(checked ? { backgroundColor: colors.primary } : {}),
			}}
		>
			{checked ? <Text className="vx-checkbox-check" style={{ fontFamily: 'system-ui', fontSize: 14, lineHeight: 20, color: colors.onPrimary }}>✓</Text> : null}
		</flexboxlayout>
		{props.label != null ? <Text className="vx-checkbox-label">{props.label}</Text> : null}
	</flexboxlayout>
}

export function Switch(props: SwitchProps) @{
	const checked = props.checked ?? false
	const colors = controlColors(useThemeScheme() === 'dark')
	<flexboxlayout
		id={props.id}
		flexDirection="row"
		justifyContent={checked ? 'end' : 'start'}
		alignItems="center"
		className={cx('vx-switch', checked && 'vx-switch--on', props.className)}
		style={{
			width: 48,
			height: 28,
			padding: 3,
			borderRadius: 14,
			backgroundColor: checked ? colors.primary : colors.border,
			...props.style,
		}}
		accessibilityRole="switch"
		accessibilityState={{ checked }}
		onTap={() => props.onCheckedChange?.(!checked)}
	>
		<flexboxlayout
			className="vx-switch-thumb"
			style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface }}
		/>
	</flexboxlayout>
}

export function Slider(props: SliderProps) @{
	const min = props.minValue ?? 0
	const max = props.maxValue ?? 100
	const drag = useRef<{ value0: number } | null>(null)
	const [dragValue, setDragValue] = useState<number | null>(null)
	const value = dragValue ?? props.value ?? min
	const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)))
	const colors = controlColors(useThemeScheme() === 'dark')
	const onPan = usePan(props.disabled ? undefined : (event: PanEvent) => {
		if (event.state === 'began') {
			drag.current = { value0: value }
			return
		}

		const width = Number(event.target?.bounds?.size?.width ?? event.target?.frame?.size?.width ?? 0)
		if (!drag.current || !width) {return}
		if (event.state === 'moved') {
			const next = Math.min(max, Math.max(min, drag.current.value0 + (event.dx / width) * (max - min)))
			setDragValue(next)
			props.onValueChange?.(next)
		} else {
			drag.current = null
			setDragValue(null)
		}
	})
	const adjustValue = (direction: number) => {
		if (props.disabled) {return}
		const next = Math.min(max, Math.max(min, value + direction * ((max - min) / 100)))
		setDragValue(next)
		props.onValueChange?.(next)
	}

	<gridlayout
		id={props.id}
		disabled={props.disabled}
		className={cx('vx-slider', props.className)}
		style={{ height: 28, ...props.style }}
		accessibilityRole={nativeAccessibilityRole('adjustable') as any}
		accessibilityValue={value}
		accessibilityMinValue={min}
		accessibilityMaxValue={max}
		onAccessibilityIncrement={() => adjustValue(1)}
		onAccessibilityDecrement={() => adjustValue(-1)}
		onPan={onPan}
	>
		<flexboxlayout
			className="vx-slider-track"
			verticalAlignment="middle"
			style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}
		/>
		<flexboxlayout
			className="vx-slider-fill"
			horizontalAlignment="left"
			verticalAlignment="middle"
			style={{ width: String(ratio * 100) + '%', height: 4, borderRadius: 2, backgroundColor: colors.primary }}
		/>
		<flexboxlayout
			className="vx-slider-thumb"
			horizontalAlignment="left"
			verticalAlignment="middle"
			style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, left: String(ratio * 100) + '%', marginLeft: -10 }}
		/>
	</gridlayout>
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
