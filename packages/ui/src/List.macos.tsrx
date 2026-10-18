/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { ListProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { toChildArray, mapChildren } from './child-array'
import { ListProvider } from './list-context'

/** List — column of rows; markers/dividers are drawn on the per-child
 *  wrapper row (no CSS counters on this target). */
export function List(props: ListProps) @{
	const listStyle = props.listStyle ?? 'none'
	const density = props.density ?? 'balanced'
	const items = toChildArray(props.children)
	const start = props.start ?? 1
	const contextValue = { density, hasDividers: props.hasDividers === true, listStyle, edgeCompensation: props.edgeCompensation, start }
	const markerFor = (index: number) =>
		listStyle === 'decimal'
			? <label className={cx('vx-list-marker', 'vx-list-marker--number')} text={`${start + index}.`} />
			: listStyle === 'disc'
				? <masonview display="flex" className={cx('vx-list-marker', 'vx-list-marker--disc')}><masonview display="flex" className="vx-list-marker-dot" /></masonview>
				: listStyle === 'circle'
					? <masonview display="flex" className={cx('vx-list-marker', 'vx-list-marker--circle')}><masonview display="flex" className="vx-list-marker-circle" /></masonview>
					: null

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<ListProvider value={contextValue}>
		<masonview display="flex" id={props.id} ref={forwardedRef} flexDirection="column" className={cx('vx-list', `vx-list--density-${density}`, props.hasDividers && 'vx-list--dividers', props.className)} style={props.style} accessibilityLabel={props.accessibilityLabel}>
			{props.header != null ? <masonview display="flex" className="vx-list-header">{props.header}</masonview> : null}
			{mapChildren(items, (child: any, index: number) => (
				<masonview display="flex" className={cx('vx-list-row', props.hasDividers && index < items.length - 1 && 'vx-list-row--divider')} flexDirection="row" alignItems="stretch">
					{markerFor(index)}
					<masonview display="flex" flexGrow={1} style={{ minWidth: 0 }}>{child}</masonview>
				</masonview>
			))}
		</masonview>
	</ListProvider>
}
