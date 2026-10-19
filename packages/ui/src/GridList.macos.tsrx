/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useMemo, useRef, useState } from 'octane'
import { Pressable } from './Pressable.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import type { GridListProps } from './props'
import { defaultItemKey, type Key, type Selection } from './list-data'
import { gridListPress, isGridListKeySelected, normalizeSelection } from './grid-list-selection'
import { applyEscapeProps, nativeAccessibilityRole } from './escape-props'
import { layoutChildProps } from './layout-child'
import { refList } from './ref-list'

/** GridList macOS leaf — same props as web. Cells are Pressables in a
 *  wrapping masonview (`columns` gives each cell a percentage width);
 *  arrow-key navigation and roving tabindex are web-only by platform
 *  nature. Tap activates onAction and toggles selection per the shared
 *  grid-list-selection mapping (no Shift-range on touch). */
export function GridList<T = any>(props: GridListProps<T>) @{
	const keys = props.items.map((item, index) => (props.keyExtractor ?? defaultItemKey)(item, index))
	const disabled = new Set<Key>(props.disabledKeys ?? [])
	const selectionMode = props.selectionMode ?? 'none'
	const [uncontrolled, setUncontrolled] = useState<Selection>(() =>
		normalizeSelection(props.defaultSelectedKeys),
	)

	const selection =
		props.selectedKeys !== undefined ? normalizeSelection(props.selectedKeys) : uncontrolled

	const anchorRef = useRef<number | null>(null)
	const isGrid = (props.layout ?? 'grid') === 'grid'

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	const press = (key: Key, index: number) => {
		if (disabled.has(key)) {
			return
		}

		props.onAction?.(key)
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
		})

		anchorRef.current = next.anchorIndex
		if (props.selectedKeys === undefined) {
			setUncontrolled(next.selection)
		}

		props.onSelectionChange?.(next.selection)
	}

	<masonview id={props.id} testID={props.testID ?? ''} ref={forwardedRef} {...layoutChildProps(props, mergeStyle({flexDirection: "row", flexWrap: isGrid ? 'wrap' : 'nowrap'}, {display: "flex"}))} className={cx('vx-gridlist', isGrid ? undefined : 'vx-gridlist--stack', props.className)} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={props.accessibilityState as any} accessibilityLiveRegion={props.accessibilityLiveRegion as any}>
		@for (const entry of props.items.map((item, index) => ({ item, index, key: keys[index] })); key entry.key) {
			<Pressable
				className={cx(
					'vx-gridlist-row',
					isGridListKeySelected(selection, entry.key) && 'vx-gridlist-row--selected',
					disabled.has(entry.key) && 'vx-gridlist-row--disabled',
				)}
				style={
					isGrid && props.columns
						? { width: `${100 / props.columns}%` }
						: !isGrid
							? { width: '100%' }
							: undefined
				}
				disabled={disabled.has(entry.key)}
				onPress={() => press(entry.key, entry.index)}
				accessibilityState={{
					selected: selectionMode !== 'none' ? isGridListKeySelected(selection, entry.key) : undefined,
					disabled: disabled.has(entry.key) || undefined,
				}}
			>
				{props.renderItem(entry.item, entry.index)}
			</Pressable>
		}
		{props.items.length === 0 && props.renderEmpty ? props.renderEmpty() : null}
	</masonview>
}
