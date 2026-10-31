/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext, useState } from 'octane'
import type { InputRatingProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import { getIcon } from '../media/icons'
import { useIconRegistry } from '../media/icon-registry-context'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField.web.tsrx'

function InputRatingControl(inputProps: InputRatingProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const max = props.max ?? 5
	const scores = Array.from({ length: max }, (_, i) => i + 1)
	const [internal, setInternal] = useState(props.defaultValue ?? 0)
	const [focused, setFocused] = useState<number | null>(null)
	const controlled = props.value !== undefined
	const value = controlled ? props.value! : internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const registry = useIconRegistry()
	const textGlyph =
		props.icon && !getIcon(props.icon, registry) && Array.from(props.icon).length === 1
			? props.icon
			: undefined
	const entry =
		focused != null && scores.includes(focused)
			? focused
			: scores.includes(value)
				? value
				: scores[0]
	const setValue = (score: number) => {
		if (isBlocked || score === value) {
			return
		}
		if (!controlled) {
			setInternal(score)
		}
		props.onValueChange?.(score)
	}
	const key = (event: KeyboardEvent, score: number) => {
		if (
			props.isDisabled ||
			event.defaultPrevented ||
			event.ctrlKey ||
			event.altKey ||
			event.metaKey
		) {
			return
		}
		const horizontal = event.key === 'ArrowRight' || event.key === 'ArrowLeft'
		const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown'
		if (horizontal || vertical) {
			event.preventDefault()
			const cell = event.currentTarget as HTMLElement
			const options = Array.from(
				cell.parentElement!.querySelectorAll<HTMLElement>('[role="radio"]'),
			)
			let direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
			if (horizontal && getComputedStyle(cell.parentElement!).direction === 'rtl') {
				direction *= -1
			}
			const index = (score - 1 + direction + options.length) % options.length
			options[index]?.focus()
			setValue(index + 1)
		} else if (event.key === ' ' && !props.isReadOnly) {
			event.preventDefault()
			setValue(score)
		}
	}
	<div ref={(element: any) => applyEscapeProps(element, props)} id={props.id}
		className={['vx-rating', props.isDisabled && 'vx-rating--disabled',
			props.isReadOnly && 'vx-rating--readonly', props.isLoading && 'vx-rating--loading',
			props.status && `vx-rating--status-${props.status.type}`,
			props.size && `vx-rating--size-${props.size}`, props.className]}
		style={props.style} role="radiogroup" aria-label={props.ariaLabel}
		aria-labelledby={props.ariaLabelledBy} aria-describedby={props.ariaDescribedBy}
		aria-description={props.ariaDescription} aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined} aria-busy={props.isLoading || undefined}
		aria-required={(props.isRequired && !props.isOptional) || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
		onBlur={(event: FocusEvent) => {
			if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
				setFocused(null)
			}
		}}
	>
		@for (const score of scores; key score) {
			<span role="radio" aria-label={`${score} of ${max}`}
				id={props.id ? `${props.id}-score-${score}` : undefined}
				aria-checked={score === value} aria-disabled={props.isDisabled || undefined}
				aria-readonly={props.isReadOnly || undefined}
				tabIndex={props.isDisabled ? undefined : score === entry ? 0 : -1}
				className={['vx-rating-cell', score <= value && 'vx-rating-cell--on']}
				onFocus={() => setFocused(score)}
				onClick={isBlocked ? undefined : () => setValue(score)}
				onKeyDown={(event: KeyboardEvent) => key(event, score)}
			>
				@if (props.icon && !textGlyph) {
					<Icon name={props.icon} className="vx-rating-glyph" size={20} />
				} @else {
					<span className="vx-rating-glyph" aria-hidden="true">{textGlyph ?? '★'}</span>
				}
			</span>
		}
	</div>
}

/** A labelled rating field with one selected score and filled preceding glyphs. */
export function InputRating(props: InputRatingProps): unknown @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<InputRatingControl {...props} />
	} @else {
		<FormField inputID={props.id} label={props.label} width={props.width}
			description={props.description} labelTooltip={props.labelTooltip} isLabelHidden={props.isLabelHidden}
			isDisabled={props.isDisabled} disabledMessage={props.disabledMessage}
			isReadOnly={props.isReadOnly} isLoading={props.isLoading}
			isRequired={props.isRequired} isOptional={props.isOptional} size={props.size}
			status={props.status} statusVariant={props.statusVariant} isGroupLabel>
			<InputRatingControl {...props} />
		</FormField>
	}
}
