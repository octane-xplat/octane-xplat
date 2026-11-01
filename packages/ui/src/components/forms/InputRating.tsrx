/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useState } from 'octane'
import type { InputRatingProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { getIcon } from '../media/icons'
import { useIconRegistry } from '../media/icon-registry-context'
import { Icon } from '../media/Icon'
import { NativeToggleField } from './NativeToggleField'
import { FieldContext, useFieldControlProps } from './field-context'

/** InputRating — row of tappable glyphs reporting a 1..max score. `icon`
 *  names a registered glyph; the default is a ★ text glyph. */
function InputRatingControl(inputProps: InputRatingProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const max = props.max ?? 5
	const [internal, setInternal] = useState(props.defaultValue ?? 0)
	const controlled = props.value !== undefined
	const value = controlled ? props.value! : internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const registry = useIconRegistry()
	const textGlyph =
		props.icon && !getIcon(props.icon, registry) && Array.from(props.icon).length === 1
			? props.icon
			: undefined

	const setValue = (n: number) => {
		if (isBlocked || n === value) {
			return
		}

		if (!controlled) {
			setInternal(n)
		}

		props.onValueChange?.(n)
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-rating',
			props.isDisabled && 'vx-rating--disabled',
			props.isReadOnly && 'vx-rating--readonly',
			props.isLoading && 'vx-rating--loading',
			props.status && `vx-rating--status-${props.status.type}`,
			props.size && `vx-rating--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!props.isDisabled}
		accessibilityRole={nativeAccessibilityRole('radiogroup')}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({
			disabled: props.isDisabled,
			readOnly: props.isReadOnly,
			required: props.isRequired,
			busy: props.isLoading,
			invalid: props.status?.type === 'error',
		})}
	>
		@for (const score of Array.from({ length: max }, (_, i) => i + 1); key score) {
			<masonview
				className={cx('vx-rating-cell', score <= value && 'vx-rating-cell--on')}
				id={props.id ? `${props.id}-score-${score}` : undefined}
				isEnabled={!props.isDisabled}
				accessibilityRole={nativeAccessibilityRole('radio')}
				accessibilityLabel={`${score} of ${max}`}
				accessibilityState={nativeAccessibilityState({
					checked: score === value,
					disabled: props.isDisabled,
					readOnly: props.isReadOnly,
				})}
				onTap={isBlocked ? undefined : () => setValue(score)}
				style={{ display: 'flex' }}
			>
				{props.icon && !textGlyph ? (
					<Icon name={props.icon} className="vx-rating-glyph" size={20} />
				) : (
					<label className="vx-rating-glyph" text={textGlyph ?? '★'} accessible={false} />
				)}
			</masonview>
		}
	</masonview>
}

/** A labelled rating field with one selected score and filled preceding glyphs. */
export function InputRating(props: InputRatingProps): unknown @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<InputRatingControl {...props} />
	} @else {
		<NativeToggleField {...props} inlineLabel={false} isGroupLabel>
			<InputRatingControl {...props} />
		</NativeToggleField>
	}
}
