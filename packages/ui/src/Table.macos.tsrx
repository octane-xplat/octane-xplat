/** @jsxImportSource @xplat/macos/renderer */
import type { TableProps, TableColumn } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Table — self-drawn grid. Bounded and unvirtualized: large datasets
 *  belong to the platform UITableView/RecyclerView subpaths. */
export function Table(props: TableProps) @{
	const cellStyle = (col: TableColumn) => ({
		...(col.width != null ? { width: col.width } : { flexGrow: 1 }),
		...(col.align ? { textAlignment: col.align } : {}),
	});

	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-table', props.className)} style={props.style}>
		<flexboxlayout className="vx-table-head">
			@for (const col of props.columns; key col.key) {
				<flexboxlayout className="vx-table-cell vx-table-th" style={cellStyle(col)}>
					<label text={col.label ?? col.key} />
				</flexboxlayout>
			}
		</flexboxlayout>
		{props.rows.length === 0 && props.empty != null
			? <flexboxlayout className="vx-table-empty">{props.empty}</flexboxlayout>
			: @for (const e of props.rows.map((row, ri) => ({ row, ri })); key props.keyFor ? props.keyFor(e.row, e.ri) : String(e.ri)) {
				<flexboxlayout
					className={cx('vx-table-row', props.onRowPress && 'vx-table-row--pressable')}
					onTap={props.onRowPress ? () => props.onRowPress!(e.row, e.ri) : undefined}
				>
					@for (const col of props.columns; key col.key) {
						<flexboxlayout className="vx-table-cell" style={cellStyle(col)}>
							{props.renderCell ? props.renderCell(e.row, col, e.ri) : <label text={String(e.row[col.key] ?? '')} />}
						</flexboxlayout>
					}
				</flexboxlayout>
			}}
	</flexboxlayout>
}
