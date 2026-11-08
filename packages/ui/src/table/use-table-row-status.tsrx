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
import { Icon } from '../components/media/Icon.tsrx'
import { Tooltip } from '../components/overlays/Tooltip.tsrx'
import { VisuallyHidden } from '../components/content/VisuallyHidden.tsrx'
import { View } from '../components/layout/View.tsrx'
import { tableSlot } from './table-slot.tsrx'

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

/** A custom marker's `status` is `never`; a set value identifies the semantic
 *  branch of the row-status union. */
function isSemanticRowStatus(value: TableRowStatusResult): value is TableSemanticRowStatus {
  return isTableRowSemanticStatus(value.status)
}

function resolveStatusIcon(icon: string): IconName {
  return (STATUS_ICONS[icon] ?? icon) as IconName
}

// The status column holds a small centered dot or icon. A fixed narrow width
// keeps every row's indicator aligned in one gutter.
const STATUS_COLUMN_WIDTH = pixel(28)

// The gutter stays visually blank, but the th needs a discernible name
// for assistive technology (axe: empty-table-header).
function StatusHeader() @{
  <VisuallyHidden>Row status</VisuallyHidden>
}

function StatusMarker(props: { status: TableRowStatusResult }) @{
  const status = props.status

  if (isSemanticRowStatus(status)) {
    return (
      <Icon
        name={resolveStatusIcon(status.status)}
        size={12}
        color={SEMANTIC_COLORS[status.status]}
      />
    )
  }

  if (typeof status.icon === 'string') {
    return (
      <Icon name={resolveStatusIcon(status.icon)} size={12} color={resolveColor(status.color)} />
    )
  }

  <View
    className="vx-table-status-dot"
    style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: resolveColor(status.color),
      flexShrink: 0,
    }}
  />
}

function StatusCell<T extends Record<string, unknown>>(props: {
  item: T
  configRef: { current: UseTableRowStatusConfig<T> }
}) @{
  const status = props.configRef.current.getStatus(props.item)

  if (!status) {
    return null as any
  }

  // No marker without a semantic status or a color — render nothing. The
  // color read stays a runtime check: untrusted callers can still return a
  // malformed custom status.
  if (!isSemanticRowStatus(status) && typeof status.color !== 'string') {
    return null as any
  }

  <Tooltip
    content={status.label}
    trigger={
      <View
        className="vx-table-status"
        style={{ alignItems: 'center', justifyContent: 'center' }}
        accessibilityRole="image"
        accessibilityLabel={status.label}
      >
        <StatusMarker status={status} />
      </View>
    }
  />
}

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

  const statusColumn: TableColumn<T> = {
    key: '__rowStatus',
    header: tableSlot(StatusHeader),
    width: STATUS_COLUMN_WIDTH,
    resizable: false,
    renderCell: (item: T) => tableSlot(StatusCell, { item, configRef }),
  }

  return {
    transformColumns(columns) {
      return [statusColumn, ...columns]
    },
  }
}

export type { TableRowStatus, TableRowStatusColor, TableSemanticRowStatus }
