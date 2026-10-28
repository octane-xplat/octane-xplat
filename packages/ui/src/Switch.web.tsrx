import { useEffect, useState, useId } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { SwitchProps } from './props'
import { applyEscapeProps } from './escape-props'
import { useFieldControl } from './field-context'
import { announce } from './announce.web'
import { STATUS_ICON_PATHS } from './status-icons'

/** Self-drawn switch following Astryx's Switch: a visually hidden native
 *  `input[type=checkbox][role=switch]` over the drawn track and thumb, the
 *  label beside it and a detached status below. The platform widget
 *  (UISwitch/MaterialSwitch) lives in `ui/ios` + `ui/android`. Inside a
 *  FormField the field owns label/description/status. */
export function Switch(inputProps: SwitchProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const checked = props.value ?? internal
	const [pending, setPending] = useState(false)
	const isBlocked = props.isDisabled || props.isReadOnly
	const loading = props.isLoading || pending
	const toggle = () => {
		if (isBlocked) {
			return
		}

		const next = !checked
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
	const size = props.size === 'sm' ? 'sm' : 'md'
	const labelFirst = props.labelPosition === 'start'
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

	// Astryx's Spinner speaks "Loading" through the persistent polite region.
	useEffect(() => {
		if (loading) {
			announce('Loading')
		}
	}, [loading])

	const textCol =
		ownChrome && props.label != null ? (
			<div className={cx('vx-switch-text', `vx-switch-text--${size}`)}>
				{props.description != null ? (
					<div className="vx-field-head">
						<label htmlFor={controlId} className={labelClass}>
							{props.label}
							{marker}
						</label>
						<span id={descriptionId} className="vx-field-description">
							{props.description}
						</span>
					</div>
				) : (
					<label htmlFor={controlId} className={labelClass}>
						{props.label}
						{marker}
					</label>
				)}
			</div>
		) : null

	<div
		className={cx(
			'vx-switch-field',
			`vx-switch-field--size-${size}`,
			checked && 'vx-switch-field--on',
			props.isDisabled && 'vx-switch-field--disabled',
			props.isReadOnly && 'vx-switch-field--readonly',
			loading && 'vx-switch-field--loading',
			props.status && `vx-switch-field--status-${props.status.type}`,
			props.className,
		)}
		style={props.style}
		data-testid={props.testID}
	>
		<div
			className={cx(
				'vx-switch-container',
				'vx-switch-row',
				props.isLabelHidden && 'vx-switch-container--label-hidden',
				props.labelSpacing === 'spread' && 'vx-switch-container--spread',
			)}
		>
			{labelFirst ? textCol : null}
			<div className={cx('vx-switch-wrapper', `vx-switch-wrapper--${size}`)}>
				<input
					ref={(el: any) => {
						if (el) {
							applyEscapeProps(el, props)
						}
					}}
					id={controlId}
					type="checkbox"
					role="switch"
					checked={checked}
					disabled={props.isDisabled || undefined}
					aria-required={showRequired || undefined}
					aria-invalid={props.status?.type === 'error' || undefined}
					aria-busy={loading || undefined}
					aria-label={ownChrome ? props.accessibilityLabel : props.ariaLabel}
					aria-labelledby={ownChrome ? undefined : props.ariaLabelledBy}
					aria-describedby={describedBy}
					aria-description={ownChrome ? undefined : props.ariaDescription}
					className="vx-switch-native"
					onChange={
						isBlocked
							? (e: any) => {
									e.preventDefault?.()
								}
							: () => toggle()
					}
				/>
				<div
					className={cx(
						'vx-switch',
						`vx-switch--size-${size}`,
						checked && 'vx-switch--on',
						props.isDisabled && 'vx-switch--disabled',
					)}
					aria-hidden="true"
				>
					<div className="vx-switch-thumb">
						@if (loading) {
							<span role="status" aria-label="Loading" className="vx-button-spinner-status">
								<svg
									width="14"
									height="14"
									aria-hidden="true"
									className="vx-button-spinner-svg"
								>
									<circle
										cx="50%"
										cy="50%"
										r="5"
										strokeWidth="2"
										className="vx-button-spinner-track"
									/>
									<circle
										cx="50%"
										cy="50%"
										r="5"
										strokeWidth="2"
										strokeDasharray="11.78 19.63"
										className="vx-button-spinner-arc"
									/>
								</svg>
							</span>
						}
					</div>
				</div>
			</div>
			{!labelFirst ? textCol : null}
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
