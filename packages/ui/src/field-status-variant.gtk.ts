import type { FieldStatusVariant } from './props'

/** GTK has pointer and keyboard intent for the shared Tooltip leaf. */
export function nativeFieldStatusVariant(variant?: FieldStatusVariant): FieldStatusVariant {
	return variant ?? 'attached'
}
