/** @jsxImportSource @xplat/macos/renderer */
import type { ActivityIndicatorProps, ButtonProps, CheckboxProps, SegmentedControlProps, SliderProps, SwitchProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { cx } from './cx'
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
	<slider
		id={props.id}
		value={props.value}
		minValue={props.minValue}
		maxValue={props.maxValue}
		onValueChange={props.onValueChange}
		className={cx('vx-slider', props.className)}
		style={{ height: 28, ...props.style }}
	/>
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
