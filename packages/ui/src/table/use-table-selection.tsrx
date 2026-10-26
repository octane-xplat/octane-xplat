// Selection plugin + state hook — port of upstream
// plugins/selection/useTableSelection(State).tsx (Astryx 0.6.4, MIT).
// Row highlight is declarative (class + aria-selected on the row render
// props) rather than upstream's imperative store — the table re-renders on
// selection state change.

import { useMemo, useRef } from 'octane'
import type { TablePlugin, TableSelectionState } from './types'
import type { TableColumn } from '../props'
import { Checkbox as CheckboxInput } from '../Checkbox'
import { View } from '../View'
import { pixel } from './column-utils'

export interface UseTableSelectionConfig<T extends Record<string, unknown>> {
	getIsItemSelected: (item: T) => boolean
	onSelectItem: (event: { item: T; isSelected: boolean }) => void
	onSelectAll: (event: { isAllSelected: boolean }) => void
	getIsAllSelected: () => boolean
	getIsIndeterminate?: () => boolean
	getIsItemSelectable?: (item: T) => boolean
	getIsItemEnabled?: (item: T) => boolean
	getRowLabel?: (item: T) => string
	/** Paint checked rows with the accent wash. @default true */
	hasRowHighlight?: boolean
}

export interface UseTableSelectionStateConfig<T extends Record<string, unknown>> {
	data: T[]
	idKey: (keyof T & string) | ((item: T) => string)
	getIsItemSelectable?: (item: T) => boolean
	getIsItemEnabled?: (item: T) => boolean
	selectedKeys: Set<string>
	setSelectedKeys: (keys: Set<string>) => void
}

export interface UseTableSelectionStateResult<T extends Record<string, unknown>> {
	selectionConfig: UseTableSelectionConfig<T>
	selectionState: TableSelectionState
}

const stableTrue = () => true

/** Manages the selection set with correct disabled/selectable filtering;
 *  pairs with `useTableSelection`. */
export function useTableSelectionState<T extends Record<string, unknown>>(
	config: UseTableSelectionStateConfig<T>,
): UseTableSelectionStateResult<T> {
	const {
		data,
		idKey,
		getIsItemSelectable = stableTrue,
		getIsItemEnabled = stableTrue,
		selectedKeys,
		setSelectedKeys,
	} = config

	const getId = (item: T): string => (typeof idKey === 'function' ? idKey(item) : String(item[idKey]))
	const getIsItemSelectableAndEnabled = (item: T) => getIsItemSelectable(item) && getIsItemEnabled(item)

	const selectableIDs = useMemo(() => new Set(data.filter(getIsItemSelectableAndEnabled).map(getId)), [data])

	const frozenSelectedIDs = useMemo(() => {
		const frozen = new Set<string>()
		for (const id of selectedKeys) if (!selectableIDs.has(id)) frozen.add(id)
		return frozen
	}, [selectedKeys, selectableIDs])

	const allSelectableIDs = useMemo(() => new Set([...selectedKeys, ...selectableIDs]), [selectedKeys, selectableIDs])

	const getAllSelected = () => {
		if (selectableIDs.size === 0) return false
		return allSelectableIDs.size === selectedKeys.size
	}
	const getIsIndeterminate = () => selectedKeys.size > 0 && !getAllSelected()

	const selectedKeysRef = useRef(selectedKeys)
	selectedKeysRef.current = selectedKeys
	const frozenRef = useRef(frozenSelectedIDs)
	frozenRef.current = frozenSelectedIDs
	const allRef = useRef(allSelectableIDs)
	allRef.current = allSelectableIDs

	const onSelectAll = ({ isAllSelected }: { isAllSelected: boolean }) => {
		if (isAllSelected) {
			setSelectedKeys(new Set(allRef.current))
		} else {
			// Deselect actionable only; preserve disabled-but-selected (frozen).
			const next = new Set(frozenRef.current)
			setSelectedKeys(next)
		}
	}

	const onSelectItem = ({ item, isSelected }: { item: T; isSelected: boolean }) => {
		const next = new Set(selectedKeysRef.current)
		if (isSelected) next.add(getId(item))
		else next.delete(getId(item))
		setSelectedKeys(next)
	}

	const selectionConfig: UseTableSelectionConfig<T> = {
		getIsItemSelected: (item) => selectedKeysRef.current.has(getId(item)),
		onSelectItem,
		onSelectAll,
		getIsAllSelected: getAllSelected,
		getIsIndeterminate,
		getIsItemSelectable,
		getIsItemEnabled,
	}

	const selectionState: TableSelectionState = {
		selectedKeys,
		selectedCount: selectedKeys.size,
		hasSelection: selectedKeys.size > 0,
		clearSelection: () => setSelectedKeys(new Set()),
	}

	return { selectionConfig, selectionState }
}

const SELECTION_COLUMN_KEY = '__xds_selection'

function SelectionCell<T extends Record<string, unknown>>(props: { item: T; configRef: { current: UseTableSelectionConfig<T> } }) @{
	const config = props.configRef.current
	const item = props.item
	const selectable = config.getIsItemSelectable?.(item) ?? true
	if (!selectable) return null as any
	const isSelected = config.getIsItemSelected(item)
	const enabled = config.getIsItemEnabled?.(item) ?? true
	const rowLabel = config.getRowLabel?.(item)
	<View className="vx-table-selection-cell">
		<CheckboxInput
			label={rowLabel != null ? `Select ${rowLabel}` : 'Select row'}
			isLabelHidden
			value={isSelected}
			onChange={() => config.onSelectItem({ item, isSelected: !isSelected })}
			isDisabled={!enabled}
			size="sm"
		/>
	</View>
}

function SelectAllCell<T extends Record<string, unknown>>(props: { configRef: { current: UseTableSelectionConfig<T> } }) @{
	const config = props.configRef.current
	const allSelected = config.getIsAllSelected()
	const indeterminate = config.getIsIndeterminate?.() ?? false
	<View className="vx-table-selection-cell">
		<CheckboxInput
			label="Select all rows"
			isLabelHidden
			value={allSelected ? true : indeterminate ? 'indeterminate' : false}
			onChange={() => config.onSelectAll({ isAllSelected: !allSelected })}
			size="sm"
		/>
	</View>
}

/** Selection plugin — injects the `__xds_selection` checkbox column and
 *  marks selected rows (`aria-selected` + `vx-table-row--selected`). */
export function useTableSelection<T extends Record<string, unknown>>(config: UseTableSelectionConfig<T>): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	const selectionColumn: TableColumn<T> = {
		key: SELECTION_COLUMN_KEY,
		header: <SelectAllCell configRef={configRef} />,
		width: pixel(36),
		resizable: false,
		renderCell: (item: T) => <SelectionCell item={item} configRef={configRef} />,
	}

	return {
		transformColumns(columns) {
			return [selectionColumn, ...columns]
		},
		transformBodyRow(props, item) {
			const cfg = configRef.current
			if (!cfg.getIsItemSelected(item)) return props
			const highlight = cfg.hasRowHighlight !== false
			return {
				...props,
				htmlProps: { ...props.htmlProps, 'aria-selected': 'true' },
				classes: [...props.classes, 'vx-table-row--selected', highlight && 'vx-table-row--selected-fill'],
			}
		},
	}
}
