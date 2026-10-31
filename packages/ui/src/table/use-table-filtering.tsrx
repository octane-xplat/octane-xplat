// Filtering plugin — port of upstream plugins/filtering/useTableFiltering
// (Astryx 0.6.4, MIT). Popover + inline variants; controls resolved from the
// field's operator value type in the shared PowerSearchConfig.

import { useMemo, useRef, useState } from 'octane'
import type {
	TablePlugin,
	HeaderCellRenderProps,
	TableFilterState,
	TableFilterValue,
	TableFilterVariant,
} from './types'

import type { TableColumn } from '../props'
import type { PowerSearchConfig, OperatorValue } from '../props'
import { resolveFilterConfig } from './to-search-filters'
import { createStaticSource } from '../components/forms/typeahead-source'
import { proportional } from './column-utils'
import { Button } from '../components/actions/Button'
import { IconButton } from '../components/media/IconButton'
import { Icon } from '../components/media/Icon'
import { usePopover } from '../components/overlays/use-popover'
import { TextInput } from '../components/forms/TextInput'
import { Select as Selector } from '../components/forms/Select'
import { SelectMenu as MultiSelector } from '../internal/rendering/aliases'
import { InputNumber as NumberInput } from '../components/forms/InputNumber'
import { DateInput } from '../components/forms/DateInput'
import { TimeInput } from '../components/forms/TimeInput'
import { Tokenizer } from '../components/forms/Tokenizer'
import { HStack } from '../components/layout/HStack'
import { VStack } from '../components/layout/VStack'
import { View } from '../components/layout/View'
import { tableSlot } from './table-slot'

/** Config for useTableFiltering — filter state, search fields, presentation. */
export interface UseTableFilteringConfig {
	/** Applied filter state — from `useTableFilterState`. */
	filters: TableFilterState
	/** Filter-change callback — null clears the column's filter. */
	onFilterChange: (key: string, value: TableFilterValue | null) => void
	/** Shared search config — `filter` refs resolve against its fields. */
	searchConfig: PowerSearchConfig
	/** Control presentation — popover button or inline row.
	 *  @default 'popover' */
	variant?: TableFilterVariant
	/** Compact-size controls for inline variants. @default 'sm' */
	inlineSize?: 'sm' | 'md'
}

const EMPTY_SOURCE = createStaticSource<{ id: string; label: string }>([])

interface ControlProps {
	columnKey: string
	header: string
	opValue: OperatorValue
	size: 'sm' | 'md'
	value: TableFilterValue | undefined
	onChange: (v: TableFilterValue | null) => void
	hasClear: boolean
	hasLabelHidden: boolean
	extra: Record<string, any>
}

/** Resolve the operator-value type to the matching xplat control. */
function FilterControl(props: ControlProps) @{
	const { columnKey, header, opValue, size, value, onChange, hasClear, hasLabelHidden, extra } =
		props

	switch (opValue.type) {
		case 'string':
			return (
				<TextInput
					label={header}
					isLabelHidden={hasLabelHidden}
					value={(value as string) ?? ''}
					onChange={(v: string) => onChange(v === '' ? null : v)}
					placeholder="Filter…"
					hasClear={hasClear}
					size={size}
					{...extra}
				/>
			)
		case 'enum':
			return (
				<Selector
					label={header}
					isLabelHidden={hasLabelHidden}
					options={(opValue.values ?? []).map((o: { value: string; label: string }) => ({
						value: o.value,
						label: o.label,
					}))}
					value={typeof value === 'string' ? value : null}
					onValueChange={(v: string | null) => onChange(v ?? null)}
					placeholder="Any"
					hasClear={hasClear}
					size={size}
					{...extra}
				/>
			)
		case 'enum_list':
			return (
				<MultiSelector
					label={header}
					isLabelHidden={hasLabelHidden}
					options={(opValue.values ?? []).map((o: { value: string; label: string }) => ({
						value: o.value,
						label: o.label,
					}))}
					value={Array.isArray(value) ? value : []}
					onValueChange={(v: string[]) => onChange(v.length === 0 ? null : v)}
					selectionMode="multiple"
					placeholder="Any"
					hasClear={hasClear}
					size={size}
					{...extra}
				/>
			)
		case 'integer':
		case 'float':
			return (
				<NumberInput
					label={header}
					isLabelHidden={hasLabelHidden}
					value={typeof value === 'number' ? value : null}
					onValueChange={(v: number | null) => onChange(v)}
					hasClear={hasClear}
					size={size}
					{...extra}
				/>
			)
		case 'date_absolute':
			return (
				<DateInput
					label={header}
					isLabelHidden={hasLabelHidden}
					value={typeof value === 'string' ? (value as any) : null}
					onChange={(v: string | null) => onChange(v)}
					hasClear={hasClear}
					{...extra}
				/>
			)
		case 'time':
			return (
				<TimeInput
					label={header}
					isLabelHidden={hasLabelHidden}
					value={typeof value === 'string' ? (value as any) : null}
					onChange={(v: string | null) => onChange(v)}
					hasClear={hasClear}
					{...extra}
				/>
			)
		case 'string_list':
		case 'entity_list':
			return (
				<Tokenizer
					label={header}
					isLabelHidden={hasLabelHidden}
					searchSource={EMPTY_SOURCE}
					value={(Array.isArray(value) ? value : []).map((v: string) => ({ id: v, label: v }))}
					onChange={(items: { id: string }[]) =>
						onChange(items.length === 0 ? null : items.map((i) => i.id))
					}
					placeholder="Filter…"
					size={size}
					{...extra}
				/>
			)
		default:
			// Unsupported operator types (nested, custom, date-relative, empty)
			// produce no control, matching upstream.
			return null as any
	}
}

function PopoverFilterTrigger(props: {
	columnKey: string
	header: string
	opValue: OperatorValue
	configRef: { current: UseTableFilteringConfig }
	size: 'sm' | 'md'
}) @{
	const [draft, setDraft] = useState<TableFilterValue | undefined>(undefined)
	const cfg = props.configRef.current
	const applied = cfg.filters[props.columnKey]
	const isFiltered = applied != null
	const headerLower = props.header.charAt(0).toLowerCase() + props.header.slice(1)
	const popover = usePopover({ dialogLabel: `Filter ${props.header}` })

	<>
		<IconButton
			ref={popover.triggerRef}
			icon={<Icon name="xplat-funnel" size={12} />}
			size={props.size}
			variant={isFiltered ? 'primary' : 'secondary'}
			label={`Filter ${props.header}`}
			clickAction={() => {
				setDraft(applied)
				popover.toggle()
			}}
			{...(popover.triggerProps as any)}
		/>
		{popover.render(
			<VStack gap={3} padding={2} width={240}>
				<FilterControl
					columnKey={props.columnKey}
					header={props.header}
					opValue={props.opValue}
					size="md"
					value={draft}
					onChange={(v: TableFilterValue | null) => setDraft(v ?? undefined)}
					hasClear={false}
					hasLabelHidden={false}
					extra={{}}
				/>
				<HStack gap={2}>
					<Button
						label="Reset"
						variant="secondary"
						isDisabled={draft == null}
						clickAction={() => {
							cfg.onFilterChange(props.columnKey, null)
							setDraft(undefined)
							popover.hide()
						}}
					/>
					<View style={{ flexGrow: 1 }} />
					<Button
						label="Apply"
						variant="primary"
						clickAction={() => {
							cfg.onFilterChange(props.columnKey, draft ?? null)
							popover.hide()
						}}
					/>
				</HStack>
			</VStack>,
			{ placement: 'below', alignment: 'start' },
		)}
	</>
}

/** Filter table plugin — adds a filter control slot to `filter`-tagged
 *  columns: popover trigger (`after`), or inline control (`below`). */
export function useTableFiltering<T extends Record<string, unknown>>(
	config: UseTableFilteringConfig,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	const variant = config.variant ?? 'popover'
	const inlineSize = config.inlineSize ?? 'sm'

	return {
		transformColumns(columns) {
			if (variant === 'popover') {
				return columns
			}

			return columns.map((col) => {
				if (!col.filter) {
					return col
				}

				const needsFilterUI = col.width?.type !== 'pixel'
				return needsFilterUI ? { ...col, width: col.width ?? proportional(1) } : col
			})
		},
		transformHeaderCell(props: HeaderCellRenderProps, column: TableColumn<T>) {
			if (!column.filter) {
				return props
			}

			const searchConfig = configRef.current.searchConfig
			const operatorValue = resolveFilterConfig(column.filter, searchConfig)
			if (!operatorValue) {
				return props
			}

			const header = typeof column.header === 'string' ? column.header : column.key
			const size = variant === 'popover' ? inlineSize : inlineSize

			if (variant === 'popover') {
				return {
					...props,
					after: [
						props.after,
						tableSlot(PopoverFilterTrigger, {
							columnKey: column.key,
							header,
							opValue: operatorValue,
							configRef,
							size: 'sm',
						}),
					],
				}
			}

			return {
				...props,
				below: [
					props.below,
					tableSlot(FilterControl, {
						columnKey: column.key,
						header,
						opValue: operatorValue,
						size,
						value: configRef.current.filters[column.key],
						onChange: (v: TableFilterValue | null) =>
							configRef.current.onFilterChange(column.key, v),
						hasClear: variant === 'inline',
						hasLabelHidden: variant === 'inline-compact',
						extra: {},
					}),
				],
			}
		},
	}
}
