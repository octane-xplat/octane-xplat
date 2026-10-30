/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useState, useId } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { CheckboxProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { useFieldControl } from './field-context'
import { announce } from '../../internal/accessibility/announce.web'
import { STATUS_ICON_PATHS } from '../../theme/status-icons'
import { CheckboxIndicator, indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'
import type { JSX } from 'octane/jsx-runtime'

/** Self-drawn checkbox following Astryx's CheckboxInput: a visually hidden
 *  native `<input type="checkbox">` under the drawn indicator, with the label
 *  and description beside it and a detached status below. The DOM
 *  `indeterminate` property carries the mixed state. Inside a FormField the
 *  field owns label/description/status, so the control renders bare. */
export function Checkbox(inputProps: CheckboxProps): JSX.Element @{
	const { props, inField } = useFieldControl(inputProps)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const resolved = props.value ?? internal
	const indeterminate = resolved === 'indeterminate'
	const checked = resolved === true
	const isBlocked = props.isDisabled || props.isReadOnly
	const [pending, setPending] = useState(false)
	const loading = props.isLoading || pending
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator
	const indState = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const toggle = () => {
		if (isBlocked) {
			return
		}

		const next = indeterminate ? true : !checked
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
		if (!props.changeAction) {
			return
		}

		const previous = checked
		setPending(true)
		Promise.resolve(props.changeAction(next)).then(
			() => setPending(false),
			() => {
				if (props.value === undefined) {
					setInternal(previous)
				}

				props.onChange?.(previous)
				setPending(false)
			},
		)
	}

	const generatedId = useId()
	const controlId = props.id ?? generatedId
	const ownChrome = !inField
	const descriptionId =
		ownChrome && props.description != null ? `${controlId}-description` : undefined

	const statusId = ownChrome && props.status?.message != null ? `${controlId}-status` : undefined
	const describedBy = ownChrome
		? [props.web?.['aria-describedby'], descriptionId, statusId].filter(Boolean).join(' ') ||
			undefined
		: props.ariaDescribedBy

	const showRequired = props.isRequired && !props.isOptional
	const labelClass = cx(
		'vx-field-label',
		props.isDisabled && 'vx-field-label--disabled',
		props.isLabelHidden && 'vx-field-label--hidden',
	)

	const marker = showRequired ? (
		<span className="vx-field-marker">
			<span className="vx-field-dot" aria-hidden="true">
				{' \u2219 '}
			</span>
			{'Required'}
		</span>
	) : props.isOptional ? (
		<span className="vx-field-marker">
			<span className="vx-field-dot" aria-hidden="true">
				{' \u2219 '}
			</span>
			{'Optional'}
		</span>
	) : null

	useEffect(() => {
		if (ownChrome && props.status?.message) {
			announce(props.status.message, props.status.type === 'error' ? 'assertive' : 'polite')
		}
	}, [ownChrome, props.status?.message, props.status?.type])

	<div
		className={cx(
			'vx-checkbox-input',
			props.size && `vx-checkbox-input--size-${props.size}`,
			props.isDisabled && 'vx-checkbox-input--disabled',
			props.isReadOnly && 'vx-checkbox--readonly',
			props.isLoading && 'vx-checkbox--loading',
			props.status && `vx-checkbox--status-${props.status.type}`,
			checked && 'vx-checkbox--on',
			props.className,
		)}
		style={props.style}
	>
		<div
			className={cx(
				'vx-checkbox-container',
				'vx-checkbox-row',
				props.isLabelHidden && 'vx-checkbox-container--label-hidden',
				!props.isDisabled && indicatorScope,
			)}
		>
			<div className="vx-checkbox-wrapper">
				<input
					ref={(el: any) => {
						if (el) {
							applyEscapeProps(el, props)
						}

						if (el) {
							el.indeterminate = indeterminate
						}
					}}
					id={controlId}
					data-testid={props.testID}
					type="checkbox"
					checked={checked}
					disabled={props.isDisabled || undefined}
					readOnly={props.isReadOnly || undefined}
					aria-checked={indeterminate ? 'mixed' : checked ? 'true' : 'false'}
					aria-disabled={
						props.isDisabled === undefined ? undefined : props.isDisabled ? 'true' : 'false'
					}
					aria-readonly={props.isReadOnly || undefined}
					aria-required={showRequired || undefined}
					aria-invalid={props.status?.type === 'error' || undefined}
					aria-busy={loading || undefined}
					aria-label={ownChrome ? props.accessibilityLabel : props.ariaLabel}
					aria-labelledby={ownChrome ? undefined : props.ariaLabelledBy}
					aria-describedby={describedBy}
					aria-description={
						props.ariaDescription ?? (ownChrome ? props.accessibilityHint : undefined)
					}
					className="vx-checkbox-native"
					onChange={
						isBlocked
							? (e: any) => {
									e.preventDefault?.()
								}
							: () => toggle()
					}
					onKeyDown={(e: any) => {
						if (e.key === ' ' && !isBlocked) {
							e.preventDefault()
							toggle()
						}
					}}
				/>
				<span className="vx-checkbox-indicator-slot">
					<Ind
						state={indState}
						size={props.size === 'sm' ? 'sm' : 'md'}
						isDisabled={props.isDisabled}
					/>
				</span>
			</div>
			@if (ownChrome && props.label != null) {
				<div className="vx-checkbox-text">
					@if (props.description != null) {
						<div className="vx-field-head">
							<label htmlFor={controlId} className={labelClass}>
								{props.label}
								{marker}
							</label>
							<span id={descriptionId} className="vx-field-description">
								{props.description}
							</span>
						</div>
					} @else {
						<label htmlFor={controlId} className={labelClass}>
							{props.label}
							{marker}
						</label>
					}
				</div>
			}
		</div>
		@if (statusId != null) {
			<div
				id={statusId}
				className={cx(
					'vx-field-status',
					`vx-field-status--${props.status!.type}`,
					'vx-field-status--detached',
				)}
			>
				<span className="vx-field-status-row">
					<span className="vx-field-status-icon-slot">
						<span className="vx-field-status-icon" aria-hidden="true">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								width="1em"
								height="1em"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d={STATUS_ICON_PATHS[props.status!.type as keyof typeof STATUS_ICON_PATHS]}
								/>
							</svg>
						</span>
					</span>
					<span>{props.status!.message}</span>
				</span>
			</div>
		}
	</div>
}
