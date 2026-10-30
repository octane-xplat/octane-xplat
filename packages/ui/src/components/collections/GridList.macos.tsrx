/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import { createAppKitGridNavigation, type AppKitGridRow } from './grid-navigation.macos'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import type { GridListProps } from '../../props'
import { defaultItemKey, type Key, type Selection } from '../../data/list-data'
import { gridListPress, isGridListKeySelected, normalizeSelection } from './grid-list-selection'
import { applyEscapeProps, nativeAccessibilityRole } from '../overlays/escape-props'
import { layoutChildProps } from '../layout/layout-child'
import { refList } from '../../internal/accessibility/ref-list'

/** AppKit GridList: registered native rows, one roving Tab stop in arrow
 * mode, native Tab stops in tab mode, and keyboard/pointer activation. */
export function GridList<T = any>(props: GridListProps<T>): unknown @{
	const keys = props.items.map((item, index) => (props.keyExtractor ?? defaultItemKey)(item, index))
	const disabled = new Set<Key>(props.disabledKeys ?? [])
	const selectionMode = props.selectionMode ?? 'none'
	const [uncontrolled, setUncontrolled] = useState<Selection>(() =>
		normalizeSelection(props.defaultSelectedKeys),
	)

	const selection =
		props.selectedKeys !== undefined ? normalizeSelection(props.selectedKeys) : uncontrolled

	const anchorRef = useRef<Key | null>(null)
	const root = useRef<NSView | null>(null)
	const rowViews = useRef(new Map<Key, NSView>())
	const latest = useRef(props)
	const liveKeys = useRef(keys)
	latest.current = props
	liveKeys.current = keys
	const activation = useRef<
		(row: AppKitGridRow, event: NativeKeyboardEvent<object>, toggleOnly: boolean) => void
	>(() => {})

	const navigation = useMemo(
		() =>
			createAppKitGridNavigation({
				root: () => root.current,
				rows: () =>
					liveKeys.current.flatMap((key) => {
						const view = rowViews.current.get(key)
						return view ? [{ key, view }] : []
					}),
				columns: () => (latest.current.layout === 'stack' ? 1 : latest.current.columns),
				tabMode: () => latest.current.keyboardNavigationBehavior === 'tab',
				press: (row, event, toggleOnly) => activation.current(row, event, toggleOnly),
			}),
		[],
	)

	useEffect(() => navigation.start(), [])
	useEffect(() => navigation.synchronize(), null)
	const isGrid = (props.layout ?? 'grid') === 'grid'

	const forwardedRef = useMemo(
		() =>
			refList<object>(
				(v: object | null) => {
					if (v) {
						applyEscapeProps(v, props)
					}
				},
				root,
				props.ref,
			),
		[props.ref, props.ios, props.android, props.web],
	)

	const press = (key: Key, event?: NativeKeyboardEvent<object>, toggleOnly = false) => {
		if (disabled.has(key)) {
			return
		}

		if (!event) {
			navigation.focusRow(key)
		}

		if (!toggleOnly) {
			props.onAction?.(key)
		}

		if (selectionMode === 'none') {
			return
		}

		const selectable = keys.filter((key) => !disabled.has(key))
		const anchor = anchorRef.current == null ? -1 : selectable.indexOf(anchorRef.current)
		const next = gridListPress({
			selection,
			key,
			index: selectable.indexOf(key),
			anchorIndex: anchor < 0 ? null : anchor,
			keys: selectable,
			shiftKey: event?.shiftKey,
			selectionMode,
			selectionBehavior: props.selectionBehavior ?? 'toggle',
			disallowEmptySelection: props.disallowEmptySelection,
		})

		anchorRef.current = selectable[next.anchorIndex] ?? null
		if (props.selectedKeys === undefined) {
			setUncontrolled(next.selection)
		}

		props.onSelectionChange?.(next.selection)
	}

	activation.current = (row, event, toggleOnly) => press(row.key, event, toggleOnly)

	<masonview
		id={props.id}
		testID={props.testID ?? ''}
		ref={forwardedRef}
		onKeyDown={navigation.onKeyDown}
		{...layoutChildProps(
			props,
			mergeStyle(
				{ flexDirection: isGrid ? 'row' : 'column', flexWrap: isGrid ? 'wrap' : 'nowrap' },
				{ display: 'flex' },
			),
		)}
		className={cx('vx-gridlist', isGrid ? undefined : 'vx-gridlist--stack', props.className)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
	>
		@for (const entry of props.items.map((item, index) => ({
				item,
				index,
				key: keys[index],
			})); key entry.key) {
			<Pressable
				ref={(view: NSView | null) => {
					if (view) {
						rowViews.current.set(entry.key, view)
					} else {
						rowViews.current.delete(entry.key)
					}
				}}
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
				onPress={() => press(entry.key)}
				accessibilityState={{
					selected:
						selectionMode !== 'none'
							? isGridListKeySelected(selection, entry.key)
							: undefined,
					disabled: disabled.has(entry.key) || undefined,
				}}
			>
				{props.renderItem(entry.item, entry.index)}
			</Pressable>
		}
		{props.items.length === 0 && props.renderEmpty ? props.renderEmpty() : null}
	</masonview>
}
