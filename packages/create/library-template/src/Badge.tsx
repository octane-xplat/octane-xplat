/** @jsxImportSource @octane-xplat/jsx */
import { Text, View } from '@octane-xplat/ui'
import { normalizeBadgeLabel } from './normalizeBadgeLabel'
import type { BadgeProps } from './props'

/**
 * Render a short label using Octane's NativeScript elements.
 * @example
 * ```tsx
 * import { Badge } from 'octane-xplat-library'
 *
 * <Badge label="Ready" />
 * ```
 */
export function Badge(props: BadgeProps) {
	return (
		<View className={props.className}>
			<Text>{normalizeBadgeLabel(props.label)}</Text>
		</View>
	)
}
