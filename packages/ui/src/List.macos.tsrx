/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ListProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'
import { toChildArray } from './child-array'
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
				? <flexboxlayout className={cx('vx-list-marker', 'vx-list-marker--disc')}><flexboxlayout className="vx-list-marker-dot" /></flexboxlayout>
				: listStyle === 'circle'
					? <flexboxlayout className={cx('vx-list-marker', 'vx-list-marker--circle')}><flexboxlayout className="vx-list-marker-circle" /></flexboxlayout>
					: null

	<ListProvider value={contextValue}>
		<flexboxlayout
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
			flexDirection="column"
			className={cx('vx-list', `vx-list--density-${density}`, props.hasDividers && 'vx-list--dividers', props.className)}
			style={props.style}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.header != null ? <flexboxlayout className="vx-list-header">{props.header}</flexboxlayout> : null}
			{items.map((child: any, index: number) => (
				<flexboxlayout
					className={cx('vx-list-row', props.hasDividers && index < items.length - 1 && 'vx-list-row--divider')}
					flexDirection="row"
					alignItems="stretch"
				>
					{markerFor(index)}
					<flexboxlayout flexGrow={1} style={{ minWidth: 0 }}>{child}</flexboxlayout>
				</flexboxlayout>
			))}
		</flexboxlayout>
	</ListProvider>
}
