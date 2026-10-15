/**
 * Trim surrounding whitespace from a badge label.
 * @example
 * ```ts
 * import { normalizeBadgeLabel } from 'octane-xplat-library'
 *
 * normalizeBadgeLabel('  Ready  ')
 * ```
 */
export function normalizeBadgeLabel(label: string): string {
	return label.trim()
}
