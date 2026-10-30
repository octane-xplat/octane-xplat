// Column settings — port of upstream plugins/columnSettings (Astryx 0.6.4,
// MIT): visibility/ordering state + the transformColumns plugin.

import { useMemo, useRef } from 'octane'
import type { TablePlugin } from './types'
import type { TableColumn } from '../props'

/** Definition of a column for the settings UI. */
export interface ColumnSettingsOption<TColumnKey extends string = string> {
	/** Column identity — matches the `TableColumn.key` it controls. */
	key: TColumnKey
	/** Display name in the settings UI. */
	label: string
	/** Column cannot be hidden (toggle is disabled). @default false */
	isAlwaysVisible?: boolean
	/** Settings-UI grouping bucket for related columns. */
	group?: string
}

export interface UseTableColumnSettingsStateConfig<TColumnKey extends string = string> {
	/** All settable columns in display order. */
	columns: ReadonlyArray<ColumnSettingsOption<TColumnKey>>
	/** Controlled visible/order list. */
	activeColumnKeys: ReadonlyArray<TColumnKey>
	/** Reports requested visibility/order changes — the controlled pair for `activeColumnKeys`. */
	onChangeActiveColumnKeys: (keys: ReadonlyArray<TColumnKey>) => void
	/** Keys restored by `resetToDefault`; defaults to the initial `activeColumnKeys`. */
	defaultColumnKeys?: ReadonlyArray<TColumnKey>
}

/** Config shape accepted by the column-settings plugin — identical to the state hook's config. */
export type UseTableColumnSettingsConfig<TColumnKey extends string = string> =
	UseTableColumnSettingsStateConfig<TColumnKey>

export interface UseTableColumnSettingsStateReturn<TColumnKey extends string = string> {
	/** Config to pass through to `useTableColumnSettings`/the Table plugin. */
	columnSettingsConfig: UseTableColumnSettingsStateConfig<TColumnKey>
	/** Currently active column keys, in display order. */
	activeColumnKeys: ReadonlyArray<TColumnKey>
	/** Flips one column's visibility (no-op on always-visible columns). */
	toggleColumn: (key: TColumnKey) => void
	/** Whether a column is currently active. */
	isColumnActive: (key: TColumnKey) => boolean
	/** Whether a column may be hidden — false for always-visible columns. */
	isColumnToggleable: (key: TColumnKey) => boolean
	/** Activates every column. */
	showAllColumns: () => void
	/** Restores `defaultColumnKeys`. */
	resetToDefault: () => void
	/** Sets the active list directly (accepts plain strings for settings UIs). */
	setActiveColumnKeys: (keys: string[]) => void
}

/** Headless column visibility/ordering state; produces
 *  `columnSettingsConfig` for `useTableColumnSettings`. */
export function useTableColumnSettingsState<TColumnKey extends string = string>(
	config: UseTableColumnSettingsStateConfig<TColumnKey>,
): UseTableColumnSettingsStateReturn<TColumnKey> {
	const { columns, activeColumnKeys } = config
	const configRef = useRef(config)
	configRef.current = config

	const activeSet = useMemo(() => new Set(activeColumnKeys), [activeColumnKeys])
	const alwaysVisibleSet = useMemo(
		() => new Set(columns.filter((c) => c.isAlwaysVisible).map((c) => c.key)),
		[columns],
	)

	const toggleColumn = (key: TColumnKey) => {
		const cfg = configRef.current
		if (cfg.columns.some((c) => c.key === key && c.isAlwaysVisible)) {
			return
		}
		const currentSet = new Set(cfg.activeColumnKeys)
		if (currentSet.has(key)) {
			cfg.onChangeActiveColumnKeys(cfg.activeColumnKeys.filter((k) => k !== key))
		} else {
			cfg.onChangeActiveColumnKeys([...cfg.activeColumnKeys, key])
		}
	}

	const isColumnActive = (key: TColumnKey) => activeSet.has(key)
	const isColumnToggleable = (key: TColumnKey) => !alwaysVisibleSet.has(key)

	const showAllColumns = () => {
		const cfg = configRef.current
		cfg.onChangeActiveColumnKeys(cfg.columns.map((c) => c.key))
	}

	const resetToDefault = () => {
		const cfg = configRef.current
		if (cfg.defaultColumnKeys) {
			cfg.onChangeActiveColumnKeys([...cfg.defaultColumnKeys])
		} else {
			cfg.onChangeActiveColumnKeys(cfg.columns.map((c) => c.key))
		}
	}

	const setActiveColumnKeys = (value: string[]) => {
		const cfg = configRef.current
		const avSet = new Set(cfg.columns.filter((c) => c.isAlwaysVisible).map((c) => c.key))
		const valueSet = new Set(value)
		for (const key of avSet) {
			valueSet.add(key)
		}
		cfg.onChangeActiveColumnKeys(Array.from(valueSet) as unknown as TColumnKey[])
	}

	return {
		columnSettingsConfig: config,
		activeColumnKeys,
		toggleColumn,
		isColumnActive,
		isColumnToggleable,
		showAllColumns,
		resetToDefault,
		setActiveColumnKeys,
	}
}

/** Column settings plugin — filters and reorders columns by active keys. */
export function useTableColumnSettings<
	T extends Record<string, unknown>,
	TColumnKey extends string = string,
>(config: UseTableColumnSettingsConfig<TColumnKey>): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	return {
		transformColumns(columns: TableColumn<T>[]): TableColumn<T>[] {
			const cfg = configRef.current
			const activeSet = new Set(cfg.activeColumnKeys)
			const orderMap = new Map(cfg.activeColumnKeys.map((key, index) => [key, index]))
			return columns
				.filter((col) => activeSet.has(col.key as TColumnKey))
				.sort((a, b) => {
					const orderA = orderMap.get(a.key as TColumnKey) ?? Infinity
					const orderB = orderMap.get(b.key as TColumnKey) ?? Infinity
					return orderA - orderB
				})
		},
	}
}
