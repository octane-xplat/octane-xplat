import { useEffect, useLayoutEffect, useMemo, useRef } from 'octane'
import type { TableColumn } from '../props'
import type { TablePlugin, UseTableStickyColumnsConfig, HeaderCellRenderProps, BodyCellRenderProps } from './types'
import { appKitHost } from '../internal/platform/host-bridge'
import { useDirection } from '../internal/platform/internationalization'
import { refList } from '../internal/accessibility/ref-list'
import { resolveStickySide } from './sticky-column-offsets'
import { createAppKitStickyColumns } from './sticky-columns-state.macos'
export type { UseTableStickyColumnsConfig } from './types'

/** Native layout pins plus row ordering; OS input/AX qualification pending. */
export function useTableStickyColumns<T extends Record<string, unknown>>(config: UseTableStickyColumnsConfig): TablePlugin<T> {
	const direction = useDirection(), live = useRef({ config, direction }); live.current = { config, direction }
	const control = useMemo(() => createAppKitStickyColumns({ direction: () => live.current.direction, retain: (view) => appKitHost()?.retainTableStickyPlacement?.(view) }), [])
	const plugin = useMemo<TablePlugin<T>>(() => {
		const decorate = <Props extends HeaderCellRenderProps | BodyCellRenderProps>(props: Props, column: TableColumn<T>, _index: number, columns: readonly TableColumn<T>[]): Props => {
			const side = resolveStickySide(columns, column.key, live.current.config.startKeys ?? [], live.current.config.endKeys ?? [])
			if (!side) return props
			return { ...props, classes: [...props.classes, 'vx-table-cell--sticky-appkit'], htmlProps: { ...props.htmlProps, ref: refList(props.htmlProps.ref, control.cell(side.edge)) } }
		}
		return {
			transformHeaderCell: decorate,
			transformBodyCell: (props, column, _item, index, columns) => decorate(props, column, index, columns),
			transformScrollWrapper: (props) => ({ ...props, htmlProps: { ...props.htmlProps, ref: refList(props.htmlProps.ref, control.bind) } }),
		}
	}, [])
	useLayoutEffect(() => control.sync(), [config.startKeys, config.endKeys, direction])
	useEffect(() => () => control.dispose(), [])
	const enabled = Boolean(config.startKeys?.length || config.endKeys?.length)
	return enabled && typeof appKitHost()?.retainTableStickyPlacement === 'function' ? plugin : {}
}
<style>
	.vx-table-cell--sticky-appkit {
		background-color: var(--table-sticky-background, var(--color-background-card, #fff));
		background-image: linear-gradient(var(--table-row-overlay, transparent), var(--table-row-overlay, transparent));
	}
</style>
