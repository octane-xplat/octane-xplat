/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo, useState } from 'octane'
import type {
	PowerSearchConfig,
	PowerSearchProps,
	PowerSearchFilter,
	PowerSearchFilterFor,
	PartialFilter,
	PowerSearchItem,
} from '../../props'

import { createInternalConfig, createPowerSearchSource } from './power-search-config'
import { PowerSearchView } from './PowerSearchView.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

export function PowerSearch<C extends PowerSearchConfig = PowerSearchConfig>(
	props: PowerSearchProps<C>,
): JSX.Element @{
	const [query, setQuery] = useState('')
	const [editing, setEditing] = useState<{ filter: PartialFilter; index: number } | null>(null)
	const [open, setOpen] = useState(false)
	const internal = useMemo(() => createInternalConfig(props.config), [props.config])
	const source = useMemo(
		() => createPowerSearchSource(internal, props.maxSearchResults ?? 10),
		[internal, props.maxSearchResults],
	)

	const results = (source.search(query) as PowerSearchItem[]).slice(0, props.maxSearchResults ?? 10)
	const choose = (item: any) => {
		const field = internal.getField(item.auxiliaryData?.fieldKey ?? item.id)
		if (!field) {
			return
		}

		setEditing({
			filter: {
				field: field.key,
				operator: item.auxiliaryData?.operatorKey ?? field.defaultOperator,
				value: item.auxiliaryData?.filterValue,
			},
			index: -1,
		})

		setOpen(false)
	}

	const save = (filter: PowerSearchFilter | null) => {
		if (!editing) {
			return
		}

		if (filter) {
			const next = [...props.filters],
				type = editing.index < 0 ? 'add' : 'edit',
				index = editing.index < 0 ? next.length : editing.index

			if (type === 'add') {
				next.push(filter as PowerSearchFilterFor<C>)
			} else {
				next[index] = filter as PowerSearchFilterFor<C>
			}

			props.onChange(next, type, index)
		}

		setEditing(null)
		setQuery('')
	}

	<PowerSearchView
		{...props}
		{internal}
		{query}
		{editing}
		{results}
		suggestionsOpen={open && !editing && !props.isDisabled}
		onQueryChange={(value: string) => {
			setQuery(value)
			setOpen(true)
		}}
		onInputFocus={() => {
			props.onFocus?.()
			setOpen(true)
		}}
		onRemove={(index) =>
			props.onChange(
				props.filters.filter((_f, i) => i !== index),
				'remove',
				index,
			)
		}
		onClear={() => props.onChange([], 'remove', -1)}
		onDismiss={() => setOpen(false)}
		onCancel={() => setEditing(null)}
		onEdit={(filter, index) => setEditing({ filter, index })}
		onChoose={choose}
		onSave={save}
	/>
}

export { PowerSearchToken } from './PowerSearchToken.web.tsrx'
export { PowerSearchFilterEditor } from './PowerSearchFilterEditor.web.tsrx'
export {
	resolveOperatorLabel,
	createPowerSearchConfig,
	usePowerSearchConfig,
} from './power-search-config'

export type { FieldDefinition, InferData } from '../../props'
