/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import type { SegmentedControlProps } from '../../props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { useFieldControlProps } from './field-context'
import { SegmentedControlProvider } from './option-list-contexts'

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`). Options come from `options` or `SegmentedControlItem`
 *  children; `layout="fill"` stretches segments to the full width. */
export function SegmentedControl(inputProps: SegmentedControlProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const select = (value: string) => {
		if (isBlocked) {
			return
		}

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

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		role="radiogroup"
		aria-label={props.ariaLabel}
		aria-labelledby={props.ariaLabelledBy}
		aria-describedby={props.ariaDescribedBy}
		aria-description={props.ariaDescription}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		aria-required={(props.isRequired && !props.isOptional) || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
		className={[
			'vx-segmented',
			props.layout === 'fill' ? 'vx-segmented--fill' : undefined,
			props.isDisabled ? 'vx-segmented--disabled' : undefined,
			props.isReadOnly ? 'vx-segmented--readonly' : undefined,
			props.isLoading ? 'vx-segmented--loading' : undefined,
			props.status ? `vx-segmented--status-${props.status.type}` : undefined,
			props.size ? `vx-segmented--size-${props.size}` : undefined,
			props.className,
		]}
		style={props.style}
	>
		{(props.options ?? []).map((opt: any) => {
			const selected = current === opt.value
			const disabled = props.isDisabled || opt.isDisabled
			const blocked = disabled || isBlocked
			return (
				<div
					key={opt.value}
					role="radio"
					aria-checked={selected}
					aria-disabled={disabled || undefined}
					aria-readonly={props.isReadOnly || undefined}
					tabIndex={disabled ? undefined : 0}
					className={[
						'vx-segment',
						selected ? 'vx-segment--on' : undefined,
						disabled ? 'vx-segment--disabled' : undefined,
						props.isReadOnly ? 'vx-segment--readonly' : undefined,
					]}
					onClick={blocked ? undefined : () => select(opt.value)}
					onKeyDown={(e: any) => {
						if (blocked) {
							return
						}

						if (e.key === ' ' || e.key === 'Enter') {
							e.preventDefault()
							select(opt.value)
						}
					}}
				>
					<span className="vx-segment-label">{opt.label ?? opt.value}</span>
				</div>
			)
		})}
		{props.children != null ? (
			<SegmentedControlProvider value={ctx}>{props.children}</SegmentedControlProvider>
		) : null}
	</div>
}
