/** @jsxImportSource @octane-xplat/jsx/dom */
import { Text, View } from '@octane-xplat/ui'
import { normalizeBadgeLabel } from './normalizeBadgeLabel'
import type { JSX } from '@octane-xplat/jsx/dom/jsx-runtime'
import type { BadgeProps } from './props'

/**
 * Render a short label using Octane's web elements.
 * @example
 * ```tsx
 * import { Badge } from 'octane-xplat-library'
 *
 * <Badge label="Ready" />
 * ```
 */
export function Badge(props: BadgeProps): JSX.Element {
	return (
		<View className={props.className}>
			<Text>{normalizeBadgeLabel(props.label)}</Text>
		</View>
	)
}
