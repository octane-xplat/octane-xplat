/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import type { ToggleButtonProps, ToggleButtonGroupProps } from './props'
import { useToggleButtonGroup, ToggleButtonGroupProvider } from './toggle-button-group-context'
import { Button } from './Button.web.tsrx'

export function ToggleButton(props: ToggleButtonProps) @{
	const group = useToggleButtonGroup()
	const [localPressed, setLocalPressed] = useState(!!props.isPressed)
	const inGroup = group != null && props.value != null
	const pressed = inGroup
		? group!.selectedValues.has(props.value!)
		: (props.isPressed ?? localPressed)

	const controlled = props.isPressed !== undefined
	const disabled = !!(props.isDisabled || group?.isDisabled)
	const size = props.size ?? group?.size ?? 'md'
	let actionValue = !pressed
	const activate = () => {
		if (disabled) {
			return
		}

		if (inGroup) {
			group!.toggle(props.value!)
			return
		}

		const next = !pressed
		actionValue = next
		if (!controlled) {
			setLocalPressed(next)
		}

		props.onPressedChange?.(next)
	}

	// Astryx: the label goes semibold while pressed and a hidden semibold
	// twin reserves the wider width so toggling doesn't shift layout. The
	// vx-button-label block span mirrors upstream Button's children wrapper —
	// it keeps the inline-flex label wrap from blockifying as a flex item.
	// Group members ignore pressedChangeAction (the group owns selection).
	const labelContent = props.isIconOnly ? undefined : (
		<span className="vx-button-label">
			<span className="vx-toggle-button-labelwrap">
				<span className={pressed ? 'vx-toggle-button-label--pressed' : undefined}>
					{props.children ?? props.label}
				</span>
				<span className="vx-toggle-button-labelreserve" aria-hidden="true">
					{props.children ?? props.label}
				</span>
			</span>
		</span>
	)

	<Button
		{...props}
		size={size}
		variant="ghost"
		isDisabled={disabled}
		icon={pressed ? (props.pressedIcon ?? props.icon) : props.icon}
		clickAction={() => {
			activate()
			return inGroup ? undefined : props.pressedChangeAction?.(actionValue)
		}}
		accessibilityState={{ ...props.accessibilityState, pressed }}
		className={[
			'vx-toggle-button',
			pressed ? 'vx-toggle-button--pressed' : undefined,
			pressed && props.color ? `vx-toggle-button--${props.color}` : undefined,
			props.className,
		]}
	>
		{labelContent}
	</Button>
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps) @{
	const type = props.type ?? 'single'
	const selected = new Set(
		Array.isArray(props.value) ? props.value : props.value == null ? [] : [props.value],
	)

	const toggle = (key: string) => {
		if (type === 'multiple') {
			const next = new Set(selected)
			if (next.has(key)) {
				next.delete(key)
			} else {
				next.add(key)
			}

			;(props as Extract<ToggleButtonGroupProps, { type: 'multiple' }>).onChange([...next])
		} else {
			;(props as Extract<ToggleButtonGroupProps, { type?: 'single' }>).onChange(
				selected.has(key) ? null : key,
			)
		}
	}

	<ToggleButtonGroupProvider
		value={{ selectedValues: selected, toggle, size: props.size, isDisabled: props.isDisabled }}
	>
		<div
			id={props.id}
			role="group"
			aria-label={props.label}
			className={[
				'vx-toggle-button-group',
				`vx-button-group--${props.orientation ?? 'horizontal'}`,
				props.className,
			]}
			style={props.style}
		>
			{props.children}
		</div>
	</ToggleButtonGroupProvider>
}
