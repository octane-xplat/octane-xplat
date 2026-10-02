import { createContext, useContext } from 'octane'
import type { FieldControlProps } from './props'
import { FormLayoutContext } from './form-layout-context'
import { InputGroupContext } from './input-group-context'

export interface FieldContextValue extends FieldControlProps {
	controlId?: string
	labelId?: string
	descriptionId?: string
	statusId?: string
}

export const FieldContext = createContext<FieldContextValue | null>(null)
export const FieldProvider: any = FieldContext

export interface ResolvedFieldControlProps extends FieldControlProps {
	id?: string
	fieldLabel?: string
	ariaLabel?: string
	ariaLabelledBy?: string
	ariaDescribedBy?: string
	accessibilityHint?: string
	/** True when the control renders inside an `InputGroup`'s surface —
	 *  it should drop its own border/radius/background chrome. */
	inInputGroup?: boolean
}

/** Resolve wrapper defaults and the accessibility links for a field control. */
export function useFieldControlProps<
	T extends FieldControlProps & {
		id?: string
		accessibilityLabel?: string
		accessibilityHint?: string
		web?: Record<string, any>
	},
>(props: T): T & ResolvedFieldControlProps {
	const field = useContext(FieldContext)
	const form = useContext(FormLayoutContext)
	const group = useContext(InputGroupContext)
	const status = field?.status ?? props.status
	const description = field?.description ?? props.description
	const ownLabel =
		props.accessibilityLabel ??
		(props.label && props.label !== field?.label ? props.label : undefined)
	const ariaDescribedBy =
		[props.web?.['aria-describedby'], field?.descriptionId, field?.statusId]
			.filter(Boolean)
			.join(' ') || undefined

	const disabledReason =
		(field?.isDisabled ?? props.isDisabled) || props.isDisabled
			? (field?.disabledMessage ?? props.disabledMessage)
			: undefined

	const hint =
		[props.accessibilityHint, description, status?.message, disabledReason]
			.filter(Boolean)
			.join('. ') || undefined

	// Resolved required (Astryx useResolvedRequired): the control announces
	// required when declared, or when the enclosing FormLayout defaults to
	// 'required'. isOptional always wins — an explicitly optional control
	// never announces required, even under a required-default form.
	const isOptional = field?.isOptional ?? props.isOptional
	const isRequired =
		!isOptional &&
		Boolean(field?.isRequired ?? props.isRequired ?? form.defaultOptionality === 'required')

	return {
		...props,
		isDisabled: Boolean(field?.isDisabled || group?.isDisabled || props.isDisabled),
		isReadOnly: Boolean(field?.isReadOnly || props.isReadOnly),
		isLoading: field?.isLoading ?? props.isLoading,
		isRequired,
		isOptional,
		size: field?.size ?? group?.size ?? props.size,
		inInputGroup: group != null,
		status,
		id: props.id ?? field?.controlId,
		fieldLabel: field?.label,
		ariaLabel: ownLabel ?? (field ? undefined : props.label),
		ariaLabelledBy: ownLabel ? undefined : (props.web?.['aria-labelledby'] ?? field?.labelId),
		ariaDescribedBy,
		accessibilityHint: hint,
	} as T & ResolvedFieldControlProps
}

/** Resolve field-control props and report whether a surrounding Field owns
 *  the label, so third-party controls can compose with Field without nesting. */
export function useFieldControl<
	T extends FieldControlProps & {
		id?: string
		accessibilityLabel?: string
		accessibilityHint?: string
		web?: Record<string, any>
	},
>(props: T): { props: T & ResolvedFieldControlProps; inField: boolean } {
	const inField = useContext(FieldContext) != null
	return { props: useFieldControlProps(props), inField }
}
