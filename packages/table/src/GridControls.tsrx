import { useState } from 'octane'
import {
	CheckboxInput as Checkbox,
	Pressable,
	HStack as Row,
	Text,
	TextInput,
	View,
} from '@octane-xplat/ui'

import { moveColumn } from './grid-layout'

function Action(props: { id?: string; label: string; disabled?: boolean; onPress: () => void }) {
	return (
		<Pressable
			id={props.id}
			className="vx-datagrid-action"
			disabled={props.disabled}
			onPress={props.onPress}
			accessibilityLabel={props.label}
		>
			<Text>{props.label}</Text>
		</Pressable>
	)
}

/** Controls subscribe through their parent's state snapshot on native too. */
export function GridControls(props: {
	table: any
	state: any
	id?: string
	settings?: boolean
	search?: boolean
}) {
	const [settingsOpen, setSettingsOpen] = useState(false)
	void props.state
	const table = props.table
	const columns = table.getAllLeafColumns()
	const order = columns.map((column: any) => column.id)
	const move = (id: string, index: number) =>
		table.setColumnOrder(moveColumn(order, id, order[index]))

	return (
		<View>
			<Row className="vx-datagrid-controls">
				{props.search ? (
					<TextInput
						id={props.id ? `${props.id}-search` : undefined}
						className="flex-1"
						value={String(props.state.globalFilter ?? '')}
						placeholder="Filter rows"
						accessibilityLabel="Filter rows"
						onChange={(value) => {
							table.setGlobalFilter(value)
							table.setPageIndex(0)
						}}
					/>
				) : null}
				{props.settings ? (
					<Action
						id={props.id ? `${props.id}-settings` : undefined}
						label="Columns"
						onPress={() => setSettingsOpen(!settingsOpen)}
					/>
				) : null}
			</Row>
			{props.settings && settingsOpen ? (
				<View className="vx-datagrid-settings">
					{columns.map((column: any, index: number) => (
						<Row key={column.id} className="vx-datagrid-controls">
							<Checkbox
								id={props.id ? `${props.id}-visible-${column.id}` : undefined}
								checked={column.getIsVisible()}
								isDisabled={!column.getCanHide()}
								label={
									typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
								}
								accessibilityLabel={`Show ${column.id}`}
								onCheckedChange={(checked) => column.toggleVisibility(checked)}
							/>
							<Action
								id={props.id ? `${props.id}-earlier-${column.id}` : undefined}
								label={`Move ${column.id} earlier`}
								disabled={index === 0}
								onPress={() => move(column.id, index - 1)}
							/>
							<Action
								id={props.id ? `${props.id}-later-${column.id}` : undefined}
								label={`Move ${column.id} later`}
								disabled={index === columns.length - 1}
								onPress={() => move(column.id, index + 1)}
							/>
						</Row>
					))}
					<Action
						id={props.id ? `${props.id}-reset-columns` : undefined}
						label="Reset columns"
						onPress={() => {
							table.resetColumnVisibility()
							table.resetColumnOrder()
							table.resetColumnSizing()
						}}
					/>
				</View>
			) : null}
		</View>
	)
}

export function GridPagination(props: {
	table: any
	state: any
	id?: string
	sizes?: readonly number[]
}) {
	void props.state
	const table = props.table
	const { pageIndex, pageSize } = props.state.pagination
	const count = table.getPageCount()
	const sizes = [
		...new Set((props.sizes ?? [10, 25, 50]).filter((size) => Number.isInteger(size) && size > 0)),
	]

	return (
		<Row className="vx-datagrid-controls" accessibilityLabel="Pagination">
			<Action
				id={props.id ? `${props.id}-previous` : undefined}
				label="Previous page"
				disabled={!table.getCanPreviousPage()}
				onPress={() => table.previousPage()}
			/>
			<Text id={props.id ? `${props.id}-page` : undefined}>
				{count < 0
					? `Page ${pageIndex + 1}`
					: `Page ${count === 0 ? 0 : pageIndex + 1} of ${count}`}
			</Text>
			<Action
				id={props.id ? `${props.id}-next` : undefined}
				label="Next page"
				disabled={!table.getCanNextPage()}
				onPress={() => table.nextPage()}
			/>
			{sizes.map((size) => (
				<Action
					key={size}
					id={props.id ? `${props.id}-size-${size}` : undefined}
					label={`${size} per page`}
					disabled={pageSize === size}
					onPress={() => {
						table.setPageSize(size)
						table.setPageIndex(0)
					}}
				/>
			))}
		</Row>
	)
}
