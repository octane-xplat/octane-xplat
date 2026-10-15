/** Props for the starter badge component. */
export interface BadgeProps {
	/** Text displayed inside the badge.
	 * @example
	 * ```tsx
	 * import { Badge } from 'octane-xplat-library'
	 *
	 * <Badge label="Ready" />
	 * ```
	 */
	label: string
	/** Optional class name forwarded to the outer view. */
	className?: string
}
