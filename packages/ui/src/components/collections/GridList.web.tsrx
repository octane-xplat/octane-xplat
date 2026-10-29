/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo, useRef, useState } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { refList } from '../../internal/accessibility/ref-list'
import type { GridListProps } from '../../props'
import { defaultItemKey, type Key, type Selection } from '../../data/list-data'
import { gridListPress, isGridListKeySelected, normalizeSelection } from './grid-list-selection'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { useGridList } from './use-grid-list'

/** GridList — interactive 2D cell collection, React Aria's GridList.
 *  Renders `role="grid"` > `role="row"` > `role="gridcell"`; rows are the
 *  focusable unit under a roving tabindex and arrows move by the measured
 *  column count (use-grid-list.web.tsrx). Press activates onAction and,
 *  when selectionMode allows, toggles/replaces selection — Space toggles
 *  without firing onAction. Not virtualized; VirtualList stays 1D. */
export function GridList<T = any>(props: GridListProps<T>) @{
	const keys = useMemo(
		() => props.items.map((item, index) => (props.keyExtractor ?? defaultItemKey)(item, index)),
		[props.items, props.keyExtractor],
	)

	const disabled = useMemo(() => new Set<Key>(props.disabledKeys ?? []), [props.disabledKeys])
	const selectionMode = props.selectionMode ?? 'none'
	const [uncontrolled, setUncontrolled] = useState<Selection>(() =>
		normalizeSelection(props.defaultSelectedKeys),
	)

	const selection =
		props.selectedKeys !== undefined ? normalizeSelection(props.selectedKeys) : uncontrolled

	const anchorRef = useRef<number | null>(null)
	const tabMode = props.keyboardNavigationBehavior === 'tab'
	const { gridRef, gridProps } = useGridList({ columns: props.columns })

	const press = (
		key: Key,
		index: number,
		event?: MouseEvent | KeyboardEvent,
		toggleOnly = false,
	) => {
		if (disabled.has(key)) {
			return
		}

		if (!toggleOnly) {
			props.onAction?.(key)
		}

		if (selectionMode === 'none') {
			return
		}

		const next = gridListPress({
			selection,
			key,
			index,
			anchorIndex: anchorRef.current,
			keys,
			selectionMode,
			selectionBehavior: props.selectionBehavior ?? 'toggle',
			disallowEmptySelection: props.disallowEmptySelection,
			shiftKey: event?.shiftKey,
		})

		anchorRef.current = next.anchorIndex
		if (props.selectedKeys === undefined) {
			setUncontrolled(next.selection)
		}

		props.onSelectionChange?.(next.selection)
	}

	const forwardedRef = useMemo(
		() =>
			refList(
				(e: any) => {
					if (e) {
						applyEscapeProps(e, props)
						applyWebProps(e, props.web)
					}
				},
				gridRef,
				props.ref,
			),
		[props.ref, props.ios, props.android, props.web],
	)

	<div
		id={props.id}
		ref={forwardedRef}
		className={['vx-gridlist', props.layout === 'stack' && 'vx-gridlist--stack', props.className]
			.filter(Boolean)
			.join(' ')}
		style={{
			...(props.columns ? { gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` } : {}),
			...styleRecord(props.style),
		}}
		role="grid"
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-rowcount={props.items.length}
		data-testid={props.testID}
		{...(tabMode ? {} : gridProps)}
	>
		{props.items.map((item, index) => {
			const key = keys[index]
			const selected = isGridListKeySelected(selection, key)
			const isDisabled = disabled.has(key)
			return (
				<div
					key={key}
					role="row"
					className={[
						'vx-gridlist-row',
						selected && 'vx-gridlist-row--selected',
						isDisabled && 'vx-gridlist-row--disabled',
					]
						.filter(Boolean)
						.join(' ')}
					tabIndex={tabMode ? 0 : -1}
					aria-selected={selectionMode !== 'none' ? selected : undefined}
					aria-disabled={isDisabled || undefined}
					data-key={key}
					onClick={(event: MouseEvent) => press(key, index, event)}
					onKeyDown={(event: KeyboardEvent) => {
						if (event.key === 'Enter') {
							event.preventDefault()
							press(key, index, event)
						} else if (event.key === ' ') {
							event.preventDefault()
							event.stopPropagation()
							press(key, index, event, true)
						}
					}}
				>
					<div role="gridcell" className="vx-gridlist-cell">
						{props.renderItem(item, index)}
					</div>
				</div>
			)
		})}
		{props.items.length === 0 && props.renderEmpty ? props.renderEmpty() : null}
	</div>
}
