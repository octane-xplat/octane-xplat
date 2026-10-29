/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useContext, useId } from 'octane'
import type { FormFieldProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { FieldProvider } from './field-context'
import { FormLayoutContext } from './form-layout-context'
import { Tooltip } from '../overlays/Tooltip.tsrx'
import { Pressable } from '../actions/Pressable'

/** Shared field wrapper for labels, descriptions, and validation status.
 *  Under `FormLayout direction="horizontal-labels"` it renders a row; the
 *  native label width is per field because the web grid's shared auto column
 *  has no native analog. Form-wide optionality suppresses redundant markers. */
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

	const status = props.status
	const statusVariant =
		props.statusVariant === 'tooltip' ? 'detached' : (props.statusVariant ?? 'attached')

	const statusId =
		status?.message == null ? undefined : (props.statusID ?? `${generatedControlId}-status`)

	const isRequired = props.isRequired && !props.isOptional
	const showRequired = isRequired && form.defaultOptionality !== 'required'
	const showOptional = Boolean(props.isOptional) && form.defaultOptionality !== 'optional'
	const labelText = showRequired
		? props.label + ' *'
		: showOptional
			? props.label + ' (Optional)'
			: props.label

	const fieldContext = {
		...props,
		controlId,
		labelId,
		descriptionId,
		statusId,
	}

	const labelNode =
		props.label == null || props.isLabelHidden ? null : (
			<masonview
				className="vx-field-label-row"
				style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
			>
				<label id={labelId} className="vx-field-label" text={labelText} />
				{props.labelTooltip != null ? (
					<Tooltip
						trigger={
							<Pressable
								className="vx-field-info"
								accessibilityLabel={'More about ' + props.label}
								accessibilityHint={props.labelTooltip}
							>
								<label text="i" />
							</Pressable>
						}
						content={props.labelTooltip}
						placement="top"
					/>
				) : null}
			</masonview>
		)

	const descriptionNode =
		props.description != null && !props.isLabelHidden ? (
			<label id={descriptionId} className="vx-field-description" text={props.description} />
		) : null

	const statusNode =
		status?.message != null ? (
			<label
				id={statusId}
				className={cx(
					'vx-field-status',
					`vx-field-status--${status.type}`,
					`vx-field-status--${statusVariant}`,
				)}
				text={status.message}
			/>
		) : null

	const rootClass = cx(
		'vx-field',
		status && `vx-field--${status.type}`,
		`vx-field--status-${statusVariant}`,
		props.isDisabled && 'vx-field--disabled',
		props.isReadOnly && 'vx-field--readonly',
		props.isLoading && 'vx-field--loading',
		props.size && `vx-field--size-${props.size}`,
		props.className,
	)

	const fieldStyle = {
		...(props.width != null ? { width: props.width } : {}),
		...styleRecord(props.style),
	}

	@if (isHorizontalLabels) {
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx(rootClass, 'vx-field--hl')}
			style={mergeStyle({ flexDirection: 'row' }, mergeStyle({ display: 'flex' }, fieldStyle))}
		>
			<masonview
				className="vx-field-hl-label"
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{labelNode}
			</masonview>
			<masonview
				className="vx-field-hl-body"
				style={mergeStyle({ flexDirection: 'column', flexGrow: 1 }, { display: 'flex' })}
			>
				{descriptionNode}
				<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
				{statusNode}
			</masonview>
		</masonview>
	} @else {
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={rootClass}
			style={mergeStyle({ display: 'flex' }, fieldStyle)}
		>
			{labelNode}
			{descriptionNode}
			<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
			{statusNode}
		</masonview>
	}
}
