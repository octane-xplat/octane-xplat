/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { RadioGroupProps } from '../../props'
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'
import { cx } from '@octane-xplat/lib'
import { useFieldControl } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { RadioListProvider } from './option-list-contexts'
import { RadioListItem } from './RadioListItem.macos.tsrx'
import { AppKitRadioViewsProvider } from './radio-focus-context.macos'
import { createAppKitChoiceFocus } from './choice-focus.macos'
import { useKeyboard, type KeyboardEvent } from '../../internal/keyboard/use-keyboard.macos'
import { useDirection } from '../../internal/platform/internationalization'

/** Options and child parts share selection and Field ownership on AppKit. */
export function RadioGroup(inputProps: RadioGroupProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const root = useRef<NSView | null>(null)
	const views = useRef(new Map<string, NSView>())
	const currentProps = useRef(props); currentProps.current = props
	const local = useRef(internal); local.current = internal
	const writing = useRef(false)
	const canChange = () => !!root.current && !currentProps.current.isDisabled && !currentProps.current.isReadOnly && !writing.current
	const select = useCallback((value: string) => {
		const next = currentProps.current
		if (!canChange() || !views.current.has(value) || next.options?.some((option) => option.value === value && option.isDisabled) ||
			value === (next.value ?? local.current)) return
		writing.current = true
		try {
			if (next.value === undefined) { local.current = value; setInternal(value) }
			next.onValueChange?.(value)
		} finally { writing.current = false }
	}, [])
	const direction = useDirection()
	const live = useRef({ current, select, direction })
	live.current = { current, select, direction }
	const navigation = useMemo(() => createAppKitChoiceFocus({
		root: () => root.current, views: views.current, selected: () => live.current.current,
		orientation: () => 'both', direction: () => live.current.direction,
		onNavigate: (value) => live.current.select(value),
		reveal: (view) => { view.scrollRectToVisible(view.bounds) },
	}), [])
	const bind = useCallback((view: NSView | null) => { if (!view) navigation.dispose(); root.current = view }, [])
	const keyDown = (event: KeyboardEvent) => { if (canChange()) navigation.keyDown(event) }
	const { keyboardProps } = useKeyboard({ onKeyDown: props.isDisabled || props.isReadOnly ? undefined : keyDown })
	useLayoutEffect(() => navigation.synchronize(), [current, props.isDisabled, props.isReadOnly])
	useEffect(() => {
		const native = globalThis as Record<string, any>
		const center = native.NSNotificationCenter?.defaultCenter
		if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) return
		let token: unknown
		try {
			token = center.addObserverForNameObjectQueueUsingBlock(
				native.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null,
				(notification: { object: NSWindow }) => { if (notification.object === root.current?.window) navigation.synchronize() },
			)
		} catch (error) {
			console.warn('[macos-radiolist] focus observation unavailable', error)
			return
		}
		return () => { if (token != null) center.removeObserver(token) }
	}, [])
	useEffect(() => () => navigation.dispose(), [])
	const context = { selected: current, select, isDisabled: props.isDisabled, isReadOnly: props.isReadOnly, size: props.size }
	const group = <RadioListProvider value={context}><AppKitRadioViewsProvider value={views.current}>
		<masonview id={controlID} ref={bind} {...keyboardProps} className={cx('vx-radio-group', 'vx-radio-group--appkit',
			props.horizontal && 'vx-radio-group--row', props.isDisabled && 'vx-radio-group--disabled',
			props.isReadOnly && 'vx-radio-group--readonly', props.isLoading && 'vx-radio-group--loading',
			props.status && `vx-radio-group--status-${props.status.type}`, props.size && `vx-radio-group--size-${props.size}`, props.className)}
			style={props.style} accessibilityRole="radiogroup"
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading,
				required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}>
			{props.options?.map((option, index) => <RadioListItem key={option.value} {...option} id={`${controlID}-option-${index}`} />)}
			{props.children}
		</masonview>
	</AppKitRadioViewsProvider></RadioListProvider>
	@if (inField) {
		{group}
	} @else {
		<FormField inputID={controlID} label={props.label} description={props.description} status={props.status}
			statusVariant={props.statusVariant} isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}
			isLoading={props.isLoading} isRequired={props.isRequired} isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden} disabledMessage={props.disabledMessage} labelTooltip={props.labelTooltip}
			width={props.width} size={props.size}>{group}</FormField>
	}
}
