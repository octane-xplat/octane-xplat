/** @jsxImportSource @octane-xplat/macos-renderer */
import { useRef, useState } from 'octane'
import type { ActivityIndicatorProps, ButtonProps, CheckboxProps, PanEvent, SearchInputProps, SegmentedControlProps, SliderProps, SwitchProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { cx } from './cx'
import { usePan } from './pan'
import { nativeAccessibilityRole } from './escape-props'
import { useThemeScheme } from './theme/theme-scheme.macos'
import { useFieldControlProps } from './field-context'
import { useButtonGroup } from './button-group-context'
import { Icon } from './Icon.macos.tsrx'

function controlColors(dark: boolean) {
	return dark
		? { border: '#2e2e2e', onPrimary: '#171717', primary: '#ededed', surface: '#0a0a0a' }
		: { border: '#eaeaea', onPrimary: '#fafafa', primary: '#171717', surface: '#ffffff' }
}

export function Button(props: ButtonProps) @{
	const group = useButtonGroup()
	const [pending, setPending] = useState(false)
	const loading = !!(props.loading || props.isLoading || pending)
	const disabled = !!(props.disabled || props.isDisabled || props.isLoading || props.loading || group?.isDisabled)
	const press = () => {
		if (disabled || (pending && !props.isInterruptible)) return
		props.onPress?.()
		const action = props.clickAction?.()
		if (action && typeof (action as any).then === 'function') {
			setPending(true)
			Promise.resolve(action).then(() => setPending(false), () => setPending(false))
		}
	}

	<Pressable id={props.id} className={cx('vx-button', `vx-button--${props.variant ?? 'secondary'}`, `vx-button--size-${props.size ?? group?.size ?? 'md'}`, group && `vx-button--group-${group.position}`, props.isIconOnly && 'vx-button--icon', disabled && 'vx-button--disabled', props.className)} style={props.style} disabled={disabled} onPress={press} accessibilityLabel={props.accessibilityLabel ?? (props.isIconOnly ? props.label : undefined)} accessibilityRole="button">
		{loading ? <ActivityIndicator /> : <>{typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon ?? props.leading}{props.children ?? (props.isIconOnly ? null : <Text>{props.label}</Text>)}{props.endContent ?? props.trailing}</>}
	</Pressable>
}

export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps)
	const checked = props.checked ?? false
	const marked = checked || props.indeterminate
	const isBlocked = props.isDisabled || props.isReadOnly
	const colors = controlColors(useThemeScheme() === 'dark')

	<flexboxlayout
		id={props.id}
		flexDirection="row"
		alignItems="center"
		gap={props.label == null ? 0 : 8}
		className={cx('vx-checkbox-row', checked && 'vx-checkbox--on', props.isDisabled && 'vx-checkbox--disabled', props.isReadOnly && 'vx-checkbox--readonly', props.isLoading && 'vx-checkbox--loading', props.status && `vx-checkbox--status-${props.status.type}`, props.size && `vx-checkbox--size-${props.size}`, props.className)}
		style={{ opacity: props.isDisabled ? 0.5 : 1, ...props.style }}
		accessibilityRole="checkbox"
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.indeterminate ? 'Partially selected' : undefined}
		accessibilityState={{ checked: props.indeterminate ? 'mixed' : checked, disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}
		onTap={isBlocked ? undefined : () => props.onCheckedChange?.(props.indeterminate ? true : !checked)}
	>
		<flexboxlayout
			className="vx-checkbox"
			alignItems="center"
			justifyContent="center"
			style={{
				width: 20,
				height: 20,
				borderWidth: 1,
				borderColor: marked ? colors.primary : colors.border,
				borderRadius: 6,
				...(marked ? { backgroundColor: colors.primary } : {}),
			}}
		>
			{marked ? <Text className="vx-checkbox-check" style={{ fontFamily: 'system-ui', fontSize: 14, lineHeight: '20px', color: colors.onPrimary }}>{props.indeterminate ? '−' : '✓'}</Text> : null}
		</flexboxlayout>
		{props.label != null ? <Text className="vx-checkbox-label">{props.label}</Text> : null}
	</flexboxlayout>
}

export function Switch(inputProps: SwitchProps) @{
	const props = useFieldControlProps(inputProps)
	const checked = props.checked ?? false
	const isBlocked = props.isDisabled || props.isReadOnly
	const colors = controlColors(useThemeScheme() === 'dark')

	<flexboxlayout
		id={props.id}
		flexDirection="row"
		justifyContent={checked ? 'end' : 'start'}
		alignItems="center"
		className={cx('vx-switch', checked && 'vx-switch--on', props.isDisabled && 'vx-switch--disabled', props.isReadOnly && 'vx-switch--readonly', props.isLoading && 'vx-switch--loading', props.status && `vx-switch--status-${props.status.type}`, props.size && `vx-switch--size-${props.size}`, props.className)}
		style={{
			width: 48,
			height: 28,
			padding: 3,
			borderRadius: 14,
			backgroundColor: checked ? colors.primary : colors.border,
			...props.style,
		}}
		accessibilityRole="switch"
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={{ checked, disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}
		onTap={isBlocked ? undefined : () => props.onCheckedChange?.(!checked)}
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

export function SearchInput(props: SearchInputProps) @{
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.isDisabled || props.isReadOnly) return
		if (props.value === undefined) setInternal(next)
		props.onChange?.(next)
	}

	<TextInput {...props} value={value} onChange={setValue} hasClear={props.hasClear !== false} placeholder={props.placeholder ?? 'Search'} />
}

export function ActivityIndicator(props: ActivityIndicatorProps) @{
	if (props.busy === false) return null;

	// Self-drawn ring — the vx-spinner class is inert on AppKit (no CSS
	// layer), so the ring chrome comes from explicit border styles. There
	// is no layer animation yet; the ring renders statically.
	<flexboxlayout
		id={props.id}
		className={cx('vx-spinner', props.className)}
		style={{ borderWidth: 2, borderTopColor: '#666666', borderColor: '#666666', borderRadius: 12, width: 24, height: 24, ...props.style }}
		accessibilityRole="progressbar"
	/>
}
