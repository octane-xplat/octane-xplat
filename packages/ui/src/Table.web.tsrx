import type { TableProps, TableColumn } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Table — self-drawn grid. Bounded and unvirtualized: large datasets
 *  belong to the platform UITableView/RecyclerView subpaths. */
export function Table(props: TableProps) @{
	const cellStyle = (col: TableColumn) => ({
		...(col.width != null ? { width: col.width } : { flex: 1 }),
		...(col.align ? { textAlign: col.align } : {}),
	});

	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-table', props.className]} style={props.style} role="table">
		<div className="vx-table-head" role="row">
			{props.columns.map((col: TableColumn) => (
				<div key={col.key} className="vx-table-cell vx-table-th" role="columnheader" style={cellStyle(col)}>
					{col.label ?? col.key}
				</div>
			))}
		</div>
		{props.rows.length === 0 && props.empty != null
			? <div className="vx-table-empty">{props.empty}</div>
			: props.rows.map((row: Record<string, any>, ri: number) => (
				<div
					key={props.keyFor ? props.keyFor(row, ri) : ri}
					className={['vx-table-row', props.onRowPress ? 'vx-table-row--pressable' : undefined]}
					role="row"
					onClick={props.onRowPress ? () => props.onRowPress!(row, ri) : undefined}
				>
					{props.columns.map((col: TableColumn) => (
						<div key={col.key} className="vx-table-cell" role="cell" style={cellStyle(col)}>
							{props.renderCell ? props.renderCell(row, col, ri) : String(row[col.key] ?? '')}
						</div>
					))}
				</div>
			))}
	</div>
}
