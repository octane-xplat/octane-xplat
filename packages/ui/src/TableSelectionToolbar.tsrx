// TableSelectionToolbar — selection-aware action surface rendered above a
// table (Astryx `TableSelectionToolbar`, 0.6.4). Renders nothing until the
// selection is non-empty; clear resets the full selection state.

import type { TableSelectionToolbarProps } from './props'
import { Toolbar } from './Toolbar'
import { Button } from './Button'
import { Text } from './Text'
import { HStack } from './HStack'

export function TableSelectionToolbar(props: TableSelectionToolbarProps) @{
	const {
		selection,
		label = 'Bulk actions',
		renderSelectionLabel,
		clearLabel = 'Unselect All',
		startContent,
		size,
		variant,
		className,
		style,
	} = props

	if (!selection.hasSelection) return null as any

	<Toolbar
		label={label}
		variant={variant ?? 'muted'}
		size={size ?? 'sm'}
		className={className}
		style={style}
		startContent={startContent}
		endContent={
			<HStack gap={4} vAlign="center">
				{renderSelectionLabel ? (
					renderSelectionLabel(selection.selectedCount)
				) : (
					<Text>{`${selection.selectedCount} selected`}</Text>
				)}
				<Button
					label={clearLabel}
					variant="secondary"
					size="sm"
					clickAction={selection.clearSelection}
				/>
			</HStack>
		}
	/>
}
