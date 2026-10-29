/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useState, useContext } from 'octane'
import type { RadioGroupProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { NativeToggleField } from '../../NativeToggleField'
import { RadioIndicator, indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'
import { RadioListProvider } from './option-list-contexts'

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Options come from the `options` prop or `RadioListItem`
 *  children (Astryx child part). */
function RadioGroupControl(inputProps: RadioGroupProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const Ind = useIndicator('radio') ?? RadioIndicator
	const select = (value: string) => {
		if (isBlocked || value === current) return
		if (props.value === undefined) {
			setInternal(value)
		}

		props.onValueChange?.(value)
	}

	const ctx = {
		selected: current as string | undefined,
		select,
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.size,
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-radio-group',
			props.horizontal && 'vx-radio-group--row',
			props.isDisabled && 'vx-radio-group--disabled',
			props.isReadOnly && 'vx-radio-group--readonly',
			props.isLoading && 'vx-radio-group--loading',
			props.status && `vx-radio-group--status-${props.status.type}`,
			props.size && `vx-radio-group--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!props.isDisabled}
		accessibilityRole={nativeAccessibilityRole('radiogroup')}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled,
			readOnly: props.isReadOnly, required: props.isRequired, busy: props.isLoading,
			invalid: props.status?.type === 'error' })}
	>
		{(props.options ?? []).map((opt: any) => {
			const selected = current === opt.value
			const disabled = props.isDisabled || opt.isDisabled
			const blocked = disabled || isBlocked
			return (
				<masonview
					key={opt.value}
					className={cx(
						'vx-radio-row',
						indicatorScope,
						selected && 'vx-radio--on',
						disabled && 'vx-radio--disabled',
						props.isReadOnly && 'vx-radio--readonly',
					)}
					isEnabled={!disabled}
					accessibilityRole={nativeAccessibilityRole('radio')}
					accessibilityLabel={opt.label ?? opt.value}
					accessibilityHint={opt.description}
					accessibilityState={nativeAccessibilityState({ checked: selected, disabled, readOnly: props.isReadOnly })}
					onTap={blocked ? undefined : () => select(opt.value)}
					style={{ display: 'flex' }}
				>
					<Ind
						state={selected ? 'checked' : 'unchecked'}
						size={props.size === 'sm' ? 'sm' : 'md'}
						isDisabled={disabled}
					/>
					<masonview
						className="vx-radio-label-col"
						style={{ display: 'flex' }}
					>
						{opt.label != null ? <label className="vx-radio-label" text={opt.label} textWrap /> : null}
						{opt.description != null ? (
							<label className="vx-radio-description" text={opt.description} textWrap />
						) : null}
					</masonview>
					{opt.endContent != null ? (
						<masonview className="vx-radio-end" style={{ display: 'flex' }}>
							{opt.endContent}
						</masonview>
					) : null}
				</masonview>
			)
		})}
		{props.children != null ? (
			<RadioListProvider value={ctx}>{props.children}</RadioListProvider>
		) : null}
	</masonview>
}


export function RadioGroup(props: RadioGroupProps) @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<RadioGroupControl {...props} />
	} @else {
		<NativeToggleField {...props} inlineLabel={false} isGroupLabel>
			<RadioGroupControl {...props} />
		</NativeToggleField>
	}
}
