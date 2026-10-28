/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useContext, useId } from 'octane'
import type { FormFieldProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { FieldProvider } from './field-context'
import { FormLayoutContext } from './form-layout-context'
import { Tooltip } from './Tooltip.tsrx'
import { Pressable } from './Pressable.macos.tsrx'

/** Shared field wrapper for labels, descriptions, and validation status.
 *  Mirrors the other platform leaves' FormLayout integration. */
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
	const statusVariant = props.statusVariant ?? 'attached'
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

	const fieldStyle = mergeStyle(props.width != null ? { width: props.width } : {}, props.style)

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
			style={mergeStyle({ display: 'flex', flexDirection: 'column' }, fieldStyle)}
		>
			{labelNode}
			{descriptionNode}
			<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
			{statusNode}
		</masonview>
	}
}
