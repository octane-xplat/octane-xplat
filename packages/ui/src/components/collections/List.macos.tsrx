/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { ListProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { toChildArray, mapChildren } from '../../internal/rendering/child-array'
import { ListProvider } from './list-context'

/** List — column of rows; markers/dividers are drawn on the per-child
 *  wrapper row (no CSS counters on this target). */
export function List(props: ListProps) @{
	const listStyle = props.listStyle ?? 'none'
	const density = props.density ?? 'balanced'
	const items = toChildArray(props.children)
	const start = props.start ?? 1
	const contextValue = {
		density,
		hasDividers: props.hasDividers === true,
		listStyle,
		edgeCompensation: props.edgeCompensation,
		start,
	}

	const markerFor = (index: number) =>
		listStyle === 'decimal' ? (
			<label
				className={cx('vx-list-marker', 'vx-list-marker--number')}
				text={`${start + index}.`}
			/>
		) : listStyle === 'disc' ? (
			<masonview
				className={cx('vx-list-marker', 'vx-list-marker--disc')}
				style={{ display: 'flex' }}
			>
				<masonview className="vx-list-marker-dot" style={{ display: 'flex' }} />
			</masonview>
		) : listStyle === 'circle' ? (
			<masonview
				className={cx('vx-list-marker', 'vx-list-marker--circle')}
				style={{ display: 'flex' }}
			>
				<masonview className="vx-list-marker-circle" style={{ display: 'flex' }} />
			</masonview>
		) : null

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<ListProvider value={contextValue}>
		<masonview
			id={props.id}
			ref={forwardedRef}
			className={cx(
				'vx-list',
				`vx-list--density-${density}`,
				props.hasDividers && 'vx-list--dividers',
				props.className,
			)}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.header != null ? (
				<masonview className="vx-list-header" style={{ display: 'flex' }}>
					{props.header}
				</masonview>
			) : null}
			{mapChildren(items, (child: any, index: number) => (
				<masonview
					className={cx(
						'vx-list-row',
						props.hasDividers && index < items.length - 1 && 'vx-list-row--divider',
					)}
					style={mergeStyle({ flexDirection: 'row', alignItems: 'stretch' }, { display: 'flex' })}
				>
					{markerFor(index)}
					<masonview
						style={mergeStyle({ flexGrow: 1 }, mergeStyle({ display: 'flex' }, { minWidth: 0 }))}
					>
						{child}
					</masonview>
				</masonview>
			))}
		</masonview>
	</ListProvider>
}
