import { createContext, useContext } from 'octane'
import type { FieldControlProps } from './props'

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
}

/** Resolve wrapper defaults and the accessibility links for a field control. */
export function useFieldControlProps<T extends FieldControlProps & { id?: string; accessibilityLabel?: string; accessibilityHint?: string; web?: Record<string, any> }>(
	props: T,
): T & ResolvedFieldControlProps {
	const field = useContext(FieldContext)
	const status = field?.status ?? props.status
	const description = field?.description ?? props.description
	const ownLabel = props.accessibilityLabel ?? (props.label && props.label !== field?.label ? props.label : undefined)
	const ariaDescribedBy = [props.web?.['aria-describedby'], field?.descriptionId, field?.statusId]
		.filter(Boolean)
		.join(' ') || undefined
	const hint = [props.accessibilityHint, description, status?.message].filter(Boolean).join('. ') || undefined

	return {
		...props,
		isDisabled: Boolean(field?.isDisabled || props.isDisabled),
		isReadOnly: Boolean(field?.isReadOnly || props.isReadOnly),
		isLoading: field?.isLoading ?? props.isLoading,
		isRequired: field?.isRequired ?? props.isRequired,
		isOptional: field?.isOptional ?? props.isOptional,
		size: field?.size ?? props.size,
		status,
		id: props.id ?? field?.controlId,
		fieldLabel: field?.label,
		ariaLabel: ownLabel ?? (field ? undefined : props.label),
		ariaLabelledBy: ownLabel ? undefined : props.web?.['aria-labelledby'] ?? field?.labelId,
		ariaDescribedBy,
		accessibilityHint: hint,
	} as T & ResolvedFieldControlProps
}
