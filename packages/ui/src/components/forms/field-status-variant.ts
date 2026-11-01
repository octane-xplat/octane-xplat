import type { FieldStatusVariant } from '../../props'

/** Touch platforms render status messages below the control. */
export function nativeFieldStatusVariant(variant?: FieldStatusVariant): FieldStatusVariant {
	return variant === 'tooltip' ? 'detached' : (variant ?? 'attached')
}
