/** @jsxImportSource @octane-xplat/jsx */
import { useLinkedState } from 'octane'
import {
	Button,
	Table,
	Text,
	View,
	pixel,
	useTableSortable,
	useTableSortableState,
	type TableColumn,
	type TableSortState,
} from '@octane-xplat/ui'

type Row = { id: string; name: string; count: number }

/** The ordinary data-mode Table, including its real sortable plugin. No
 * fixture command dispatches sorting or supplies substitute header controls. */
export function TableCases(props: {
	revision: number
	onActivate: (source: string, fixtureRevision?: number) => void
}): unknown @{
	const [sort, setSort] = useLinkedState(props.revision, (): TableSortState => [])
	const data: Row[] = Array.from({ length: props.revision === 3 ? 40 : 3 }, (_, index) => ({
		id: String(index),
		name: `Row ${String(index + 1).padStart(2, '0')} revision ${props.revision}`,
		count: index,
	}))
	const columns: TableColumn<Row>[] = [
		{ key: 'name', header: `Name ${props.revision}`, sortable: true },
		{ key: 'count', header: 'Count', width: pixel(80), align: 'end' },
	]
	const state = useTableSortableState<Row>({
		data,
		sort,
		onSortChange: (next) => {
			props.onActivate(`table-sort:${JSON.stringify(next)}`, props.revision)
			// Revision2 deliberately retains the controlled value after a request.
			if (props.revision !== 2) {
				setSort(next)
			}
		},
	})
	const sortable = useTableSortable<Row>(state.sortConfig)

	<View className="core20-viewport">
		<Button label="Before table" clickAction={() => props.onActivate('table-before')} />
		<Text id="core20-table-state">{`Table sort ${JSON.stringify(sort)}`}</Text>
		<Table
			id="core20-table"
			data={state.sortedData}
			columns={columns}
			idKey="id"
			plugins={{ sortable }}
			density={props.revision ? 'compact' : 'balanced'}
		/>
		<Button label="After table" clickAction={() => props.onActivate('table-after')} />
	</View>
}
