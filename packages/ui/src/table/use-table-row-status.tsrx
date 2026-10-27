// Row-status plugin — port of upstream plugins/rowStatus/useTableRowStatus.tsx
// (Astryx 0.6.4, MIT). Shared leaf: prepends a narrow gutter column with a
// semantic icon or custom color marker, wrapped in a Tooltip and labelled via
// role="img" + accessibilityLabel. Upstream icon names (success, warning,
// error, clock, info) map to the registered xplat glyphs.

import { useRef } from 'octane'
import type {
	TablePlugin,
	TableRowStatus,
	TableRowStatusColor,
	TableSemanticRowStatus,
} from './types'

import type { TableColumn, IconName } from '../props'
import { pixel } from './column-utils'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'
import { VisuallyHidden } from '../VisuallyHidden'
import { View } from '../View'

/** Configuration for `useTableRowStatus`. */
export interface UseTableRowStatusConfig<T extends Record<string, unknown>> {
	/** Derive the status indicator for a row. Return `null` for no indicator. */
	getStatus: (item: T) => (TableRowStatus & { status?: never }) | TableSemanticRowStatus | null
}

type TableRowStatusResult = Exclude<
	ReturnType<UseTableRowStatusConfig<Record<string, unknown>>['getStatus']>,
	null
>

/** Named colors resolve to the icon color tokens; raw CSS colors pass through. */
const NAMED_COLORS: Record<TableRowStatusColor, string> = {
	accent: 'var(--color-icon-accent)',
	success: 'var(--color-icon-green)',
	error: 'var(--color-icon-red)',
	warning: 'var(--color-icon-orange)',
	red: 'var(--color-icon-red)',
	orange: 'var(--color-icon-orange)',
	green: 'var(--color-icon-green)',
	yellow: 'var(--color-icon-yellow)',
	blue: 'var(--color-icon-blue)',
	gray: 'var(--color-icon-gray)',
}

/** Semantic statuses → themed icon token colors. */
const SEMANTIC_COLORS: Record<TableSemanticRowStatus['status'], string> = {
	success: 'var(--color-icon-green)',
	warning: 'var(--color-icon-orange)',
	error: 'var(--color-icon-red)',
}

/** Upstream icon names used by the examples → registered xplat glyphs. */
const STATUS_ICONS: Record<string, IconName> = {
	success: 'xplat-success',
	warning: 'xplat-warning',
	error: 'xplat-error',
	clock: 'xplat-clock',
	info: 'xplat-info',
}

/** Resolve a named color to a token, or pass a raw CSS color through. */
function resolveColor(color: string): string {
	return (NAMED_COLORS as Record<string, string>)[color] ?? color
}

function isTableRowSemanticStatus(value: unknown): value is TableSemanticRowStatus['status'] {
	return value === 'success' || value === 'warning' || value === 'error'
}

function resolveStatusIcon(icon: string): IconName {
	return (STATUS_ICONS[icon] ?? icon) as IconName
}

// The status column holds a small centered dot or icon. A fixed narrow width
// keeps every row's indicator aligned in one gutter.
const STATUS_COLUMN_WIDTH = pixel(28)

/**
 * Returns a `TablePlugin` that prepends a narrow column signaling per-row
 * status. A semantic `status` resolves a themed glyph and tone; a custom
 * `color` renders the 8px dot unless the caller also provides an `icon`.
 */
export function useTableRowStatus<T extends Record<string, unknown>>(
	config: UseTableRowStatusConfig<T>,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	const renderMarker = (status: TableRowStatusResult) => {
		const untyped = status as { status?: unknown; color?: unknown; icon?: unknown }

		if (isTableRowSemanticStatus(untyped.status)) {
			return (
				<Icon
					name={resolveStatusIcon(untyped.status)}
					size={12}
					color={SEMANTIC_COLORS[untyped.status]}
				/>
			)
		}

		if (typeof untyped.color !== 'string') {
			return null
		}

		if (typeof untyped.icon === 'string') {
			return (
				<Icon
					name={resolveStatusIcon(untyped.icon)}
					size={12}
					color={resolveColor(untyped.color)}
				/>
			)
		}

		return (
			<View
				className="vx-table-status-dot"
				style={{
					width: 8,
					height: 8,
					borderRadius: '50%',
					backgroundColor: resolveColor(untyped.color),
					flexShrink: 0,
				}}
			/>
		)
	}

	const statusColumn: TableColumn<T> = {
		key: '__rowStatus',
		// The gutter stays visually blank, but the th needs a discernible name
		// for assistive technology (axe: empty-table-header).
		header: <VisuallyHidden>Row status</VisuallyHidden>,
		width: STATUS_COLUMN_WIDTH,
		resizable: false,
		renderCell: (item: T) => {
			const status = configRef.current.getStatus(item)
			if (!status) {
				return null
			}

			const marker = renderMarker(status)
			if (!marker) {
				return null
			}

			return (
				<Tooltip
					content={status.label}
					trigger={
						<View
							className="vx-table-status"
							style={{ alignItems: 'center', justifyContent: 'center' }}
							accessibilityRole="image"
							accessibilityLabel={status.label}
						>
							{marker}
						</View>
					}
				/>
			)
		},
	}

	return {
		transformColumns(columns) {
			return [statusColumn, ...columns]
		},
	}
}

export type { TableRowStatus, TableRowStatusColor, TableSemanticRowStatus }
