import { useId, useState } from 'octane'
import type { CheckboxGroupProps } from './props'
import { applyEscapeProps } from './escape-props'
import { Checkbox } from './Checkbox.web.tsrx'
import { List } from './List.web.tsrx'
import { ListItem } from './ListItem.web.tsrx'
import { FormField } from './FormField.web.tsrx'
import { FieldProvider, useFieldControl, useFieldControlProps } from './field-context'
import { CheckboxListProvider } from './option-list-contexts'

/** CheckboxGroup — multi-select list of self-drawn checkboxes. Options
 *  come from the `options` prop (rendered as `List`/`ListItem` rows pairing
 *  a hidden-label checkbox with its visible text) or `CheckboxListItem`
 *  children (Astryx child part, reading state from the group context);
 *  `hasDividers` draws hairlines between rows. Standalone groups render
 *  Astryx's field chrome (span label — a group has no single control)
 *  around the `role="group"` container. */
export function CheckboxGroup(inputProps: CheckboxGroupProps) @{
	const { inField } = useFieldControl(inputProps)
	const generatedId = useId()
	const controlId = inputProps.id ?? generatedId
	const needsChrome =
		!inField &&
		(inputProps.label != null ||
			inputProps.description != null ||
			inputProps.status != null ||
			inputProps.isRequired ||
			inputProps.isOptional)

	const bareProps = needsChrome
		? {
				...inputProps,
				label: undefined,
				description: undefined,
				status: inputProps.status ? { type: inputProps.status.type } : undefined,
				web: {
					...inputProps.web,
					'aria-labelledby': `${controlId}-label`,
					'aria-describedby':
						[
							inputProps.web?.['aria-describedby'],
							inputProps.description != null ? `${controlId}-description` : undefined,
							inputProps.status?.message != null ? `${controlId}-status` : undefined,
						]
							.filter(Boolean)
							.join(' ') || undefined,
				},
			}
		: inputProps

	const props = useFieldControlProps(bareProps)
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? [])
	const controlled = props.value !== undefined
	const selected = controlled ? props.value! : internal

	const setSelected = (next: string[]) => {
		if (!controlled) {
			setInternal(next)
		}

		props.onValueChange?.(next)
	}

	const toggle = (v: string, on: boolean) =>
		setSelected(on ? [...selected, v] : selected.filter((x) => x !== v))

	const isReadOnly = props.isReadOnly
	const density = props.density ?? 'balanced'
	const optionSize = density === 'compact' ? 'sm' : 'md'
	const ctx = {
		selected,
		select: (v: string, on?: boolean) => toggle(v, on ?? true),
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.size,
	}

	const group = (
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={needsChrome ? undefined : props.id}
			role="group"
			aria-label={props.ariaLabel}
			aria-labelledby={props.ariaLabelledBy}
			aria-describedby={props.ariaDescribedBy}
			aria-description={props.ariaDescription}
			aria-disabled={props.isDisabled || undefined}
			aria-readonly={isReadOnly || undefined}
			aria-busy={props.isLoading || undefined}
			className={[
				'vx-checkbox-group',
				props.horizontal ? 'vx-checkbox-group--row' : undefined,
				props.hasDividers ? 'vx-checkbox-group--divided' : undefined,
				props.isDisabled ? 'vx-checkbox-group--disabled' : undefined,
				isReadOnly ? 'vx-checkbox-group--readonly' : undefined,
				props.isLoading ? 'vx-checkbox-group--loading' : undefined,
				props.status ? `vx-checkbox-group--status-${props.status.type}` : undefined,
				props.size ? `vx-checkbox-group--size-${props.size}` : undefined,
				props.className,
			]}
			style={needsChrome ? undefined : props.style}
		>
			{props.options?.length ? (
				<List
					density={density}
					hasDividers={props.hasDividers}
					className={props.horizontal ? 'vx-checkbox-list--row' : undefined}
				>
					{props.options.map((opt: any) => {
						const optId = `${controlId}-opt-${opt.value}`
						return (
							<ListItem
								key={opt.value}
								isDisabled={props.isDisabled || opt.isDisabled}
								label={opt.label}
								description={opt.description}
								delegateRef={{
									current: {
										click: () => (document.getElementById(optId) as any)?.click(),
										focus: () => (document.getElementById(optId) as any)?.focus(),
									},
								}}
								startContent={
									<FieldProvider value={null}>
										<Checkbox
											id={optId}
											value={selected.includes(opt.value)}
											isDisabled={props.isDisabled || opt.isDisabled}
											isReadOnly={isReadOnly}
											label={opt.label}
											isLabelHidden
											size={optionSize}
											onChange={(on: boolean) => toggle(opt.value, on)}
										/>
									</FieldProvider>
								}
							/>
						)
					})}
				</List>
			) : null}
			{props.children != null ? (
				<CheckboxListProvider value={ctx}>{props.children}</CheckboxListProvider>
			) : null}
		</div>
	)

	if (!needsChrome) {
		return group
	}

	return (
		<FormField
			inputID={controlId}
			labelID={`${controlId}-label`}
			descriptionID={`${controlId}-description`}
			statusID={`${controlId}-status`}
			isGroupLabel
			label={inputProps.label}
			description={inputProps.description}
			status={inputProps.status}
			isRequired={inputProps.isRequired}
			isOptional={inputProps.isOptional}
			isLabelHidden={inputProps.isLabelHidden}
			isDisabled={inputProps.isDisabled}
			labelTooltip={inputProps.labelTooltip}
			disabledMessage={inputProps.disabledMessage}
			width={inputProps.width}
		>
			{group}
		</FormField>
	)
}
