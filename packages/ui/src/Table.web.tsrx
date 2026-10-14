import type { Key, TableProps, TableColumn } from "./props";
import { applyEscapeProps } from "./escape-props";

function rowKey<T extends object>(props: TableProps<T>, row: T, index: number): Key {
	if (typeof props.idKey === 'function') return props.idKey(row, index);
	if (props.idKey !== undefined) {
		return (((row as Record<PropertyKey, unknown>)[props.idKey]) ?? index) as Key;
	}
	const named = row as { id?: Key; key?: Key };
	return named.id ?? named.key ?? index;
}

/** Table — self-drawn grid. Bounded and unvirtualized: large datasets
 *  belong to the platform UITableView/RecyclerView subpaths. */
export function Table<T extends object = Record<string, any>>(props: TableProps<T>) @{
	const cellStyle = (col: TableColumn<keyof T & Key>) => ({
		...(col.width != null ? { width: col.width } : { flex: 1 }),
		...(col.align ? { textAlign: col.align } : {}),
	});

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-table', props.className]} style={props.style} role="table">
		<div className="vx-table-head" role="row">
			{props.columns.map((col) => (
				<div key={col.key} className="vx-table-cell vx-table-th" role="columnheader" style={cellStyle(col)}>
					{col.label ?? col.key}
				</div>
			))}
		</div>
		{props.rows.length === 0 && props.empty != null
			? <div className="vx-table-empty">{props.empty}</div>
			: props.rows.map((row: T, ri: number) => (
				<div
					key={rowKey(props, row, ri)}
					className={['vx-table-row', props.onRowPress ? 'vx-table-row--pressable' : undefined]}
					role="row"
					onClick={props.onRowPress ? () => props.onRowPress!(row, ri) : undefined}
				>
					{props.columns.map((col) => (
						<div key={col.key} className="vx-table-cell" role="cell" style={cellStyle(col)}>
							{props.renderCell ? props.renderCell(row, col, ri) : String((row as Record<Key, unknown>)[col.key] ?? '')}
						</div>
					))}
				</div>
			))}
	</div>
}
