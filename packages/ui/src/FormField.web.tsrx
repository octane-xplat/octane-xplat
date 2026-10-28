/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext, useEffect, useId } from 'octane'
import { cx } from '@octane-xplat/lib'
import { styleRecord } from './style-merge'
import type { FormFieldProps } from './props'
import { applyEscapeProps } from './escape-props'
import { FieldProvider } from './field-context'
import { FormLayoutContext } from './form-layout-context'
import { Tooltip } from './Tooltip.web.tsrx'
import { announce } from './announce.web'

/** Shared field wrapper for labels, descriptions, and validation status.
 *  Under a `FormLayout`, horizontal labels flatten the root so the grid can
 *  place labels and controls in shared columns. Form-wide optionality hides
 *  redundant markers while controls retain their required accessibility state. */
export function FormField(props: FormFieldProps) @{
	const generatedControlId = useId()
	const form = useContext(FormLayoutContext)
	const isHorizontalLabels = form.direction === 'horizontal-labels'
	const controlId = props.inputID ?? generatedControlId
	const labelId = props.label == null ? undefined : (props.labelID ?? `${generatedControlId}-label`)
	const descriptionId =
		props.description == null
			? undefined
			: (props.descriptionID ?? `${generatedControlId}-description`)

	const isRequired = props.isRequired && !props.isOptional
	const status = props.status
	const statusVariant = props.statusVariant ?? 'attached'
	const statusId =
		status?.message == null ? undefined : (props.statusID ?? `${generatedControlId}-status`)

	const fieldContext = {
		...props,
		controlId,
		labelId,
		descriptionId,
		statusId,
	}

	const showRequired = isRequired && form.defaultOptionality !== 'required'
	const showOptional = Boolean(props.isOptional) && form.defaultOptionality !== 'optional'
	const labelAffordance =
		props.labelTooltip != null ? (
			<Tooltip
				trigger={
					<span className="vx-field-label-tip" aria-hidden="true">
						{'?'}
					</span>
				}
				content={props.labelTooltip}
				placement="top"
			/>
		) : null

	const marker = showRequired ? (
		<span className="vx-field-marker">
			<span className="vx-field-dot" aria-hidden="true">
				{' \u2219 '}
			</span>
			Required
		</span>
	) : showOptional ? (
		<span className="vx-field-marker">
			<span className="vx-field-dot" aria-hidden="true">
				{' \u2219 '}
			</span>
			Optional
		</span>
	) : null

	const labelText =
		props.label != null ? (
			<>
				{props.label}
				{marker}
				{labelAffordance}
			</>
		) : null

	const labelNode =
		props.label != null ? (
			props.isGroupLabel ? (
				<span
					id={labelId}
					className={cx('vx-field-label', props.isLabelHidden && 'vx-field-label--hidden')}
				>
					{labelText}
				</span>
			) : (
				<label
					id={labelId}
					htmlFor={controlId}
					className={cx('vx-field-label', props.isLabelHidden && 'vx-field-label--hidden')}
				>
					{labelText}
				</label>
			)
		) : null

	const descriptionNode =
		props.description != null ? (
			<span
				id={descriptionId}
				className={cx(
					'vx-field-description',
					props.isLabelHidden && 'vx-field-description--hidden',
				)}
			>
				{props.description}
			</span>
		) : null

	// Astryx: the visible status is plain text linked by aria-describedby; it is
	// spoken through the persistent document-level live regions instead.
	const statusNode =
		status?.message != null ? (
			<div
				id={statusId}
				className={cx(
					'vx-field-status',
					`vx-field-status--${status.type}`,
					`vx-field-status--${statusVariant}`,
				)}
			>
				{status.message}
			</div>
		) : null

	useEffect(() => {
		if (status?.message) {
			announce(status.message, status.type === 'error' ? 'assertive' : 'polite')
		}
	}, [status?.message, status?.type])

	const rootClass = [
		'vx-field',
		status ? `vx-field--${status.type}` : undefined,
		`vx-field--status-${statusVariant}`,
		props.isDisabled ? 'vx-field--disabled' : undefined,
		props.isReadOnly ? 'vx-field--readonly' : undefined,
		props.isLoading ? 'vx-field--loading' : undefined,
		props.size ? `vx-field--size-${props.size}` : undefined,
		props.className,
	]

	const fieldStyle = {
		...(props.width != null ? { width: props.width } : {}),
		...styleRecord(props.style),
	}

	@if (isHorizontalLabels) {
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={[...rootClass, 'vx-field--hl']}
			style={fieldStyle}
		>
			<div className="vx-field-hl-label">{labelNode}</div>
			<div className="vx-field-hl-body">
				{descriptionNode}
				<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
				{statusNode}
			</div>
		</div>
	} @else {
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={rootClass}
			style={fieldStyle}
		>
			{descriptionNode != null ? (
				<div className="vx-field-head">
					{labelNode}
					{descriptionNode}
				</div>
			) : (
				labelNode
			)}
			<div className="vx-field-body">
				<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
				{statusVariant === 'attached' ? statusNode : null}
			</div>
			{statusVariant !== 'attached' ? statusNode : null}
		</div>
	}
}
